import re
from datetime import datetime
from pathlib import Path
from shlex import split
from subprocess import PIPE, Popen

from github import Auth, Github
from github.GitCommit import GitCommit
from httpx import URL

from dvalin_tools.lib.settings import DvalinSettings, GitSettings

AUTO_DATA_EVENT_BRANCH_PREFIX = "auto-data-event"
COMMIT_MESSAGE_PREFIX = "feat: Auto-data: Event:"

# Regex for branch that are handled by the bot
RE_AUTO_DATA_EVENT_BRANCH = re.compile(
    rf"^(origin/)?{AUTO_DATA_EVENT_BRANCH_PREFIX}/(.*)$"
)

git_settings: GitSettings = DvalinSettings().git


class Repository:
    def __init__(self, path: Path, master_name: str = "main") -> None:
        self.path = path
        self.temp_branches = []
        self.master_name = master_name

    def _execute(self, command: str | list[str]) -> str:
        cmd_as_list = split(command) if isinstance(command, str) else command
        process = Popen(cmd_as_list, cwd=self.path, stdout=PIPE, stderr=PIPE)
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            raise ValueError(f"Command failed: {command}\n{stderr.decode()}")
        return stdout.decode()

    def initialize_git_config(self) -> None:
        self._execute(f"git config user.email {git_settings.user_email}")
        self._execute(f"git config user.name {git_settings.user_name}")
        self._execute(f"git remote set-url origin {self.get_remote_url_with_auth()}")
        print(
            f"Initialized git config with `{git_settings.user_name} <{git_settings.user_email}>`"
        )

    def get_current_branch(self) -> str:
        return self._execute("git rev-parse --abbrev-ref HEAD").strip()

    def create_temporary_branch(self) -> str:
        name = f"tmp-{datetime.now():%Y%m%d_%H%M%S}"
        self._execute(f"git checkout -b {name}")
        self.temp_branches.append(name)
        return name

    def checkout_remote_branch(self, branch_name: str) -> None:
        self._execute(f"git checkout -b {branch_name} origin/{branch_name}")

    def rename_current_branch(self, new_name: str) -> None:
        self._execute(f"git branch -m {new_name}")

    def reset_to_master(self) -> None:
        """Go to master, and make sure it's up-to-date with origin/master."""
        self._execute(f"git checkout {self.master_name}")
        self._execute(f"git pull origin {self.master_name}")

    def get_all_branches(self) -> list[str]:
        return self._execute("git branch -a --format='%(refname:short)'").splitlines()

    def get_remote_branches(self) -> list[str]:
        return self._execute("git branch -r --format='%(refname:short)'").splitlines()

    @staticmethod
    def filter_auto_branches(branches: list[str]) -> list[str]:
        return [
            branch for branch in branches if RE_AUTO_DATA_EVENT_BRANCH.match(branch)
        ]

    def get_all_auto_branches(self) -> list[str]:
        return self.filter_auto_branches(self.get_all_branches())

    def get_remote_auto_branches(self) -> list[str]:
        return self.filter_auto_branches(self.get_remote_branches())

    def destroy_all_local_branches(self) -> None:
        current_branch = self.get_current_branch()
        local_branches = self._execute(
            "git branch --format='%(refname:short)'"
        ).splitlines()
        for branch in local_branches:
            if branch not in (self.master_name, current_branch):
                self._execute(f"git branch -D {branch}")

    def commit_and_push(
        self, file_list: list[Path] | None = None, commit_message_body: str = ""
    ) -> None:
        if file_list is None:
            self._execute("git add .")
        else:
            self._execute(
                [
                    "git",
                    "add",
                    *[str(file.relative_to(self.path)) for file in file_list],
                ]
            )
        commit_message = f"{COMMIT_MESSAGE_PREFIX} {datetime.now():%Y-%m-%d %H:%M:%S}\n\n{commit_message_body}"
        commit_message = commit_message.replace("'", r"\'")
        self._execute(["git", "commit", "-m", commit_message])
        self._execute(f"git push origin {self.get_current_branch()}")

    def get_remote_url(self) -> URL:
        return URL(self._execute("git remote get-url origin").strip())

    def get_remote_url_with_auth(self) -> URL:
        url_origin = self.get_remote_url()
        username = git_settings.github_username
        token = git_settings.private_access_token
        return url_origin.copy_with(username=username, password=token)

    def get_repo_name(self) -> str:
        return self.get_remote_url().path.removeprefix("/").removesuffix(".git")

    @staticmethod
    def generate_auto_branch_name() -> str:
        return f"{AUTO_DATA_EVENT_BRANCH_PREFIX}/{datetime.now():%Y%m%d_%H%M%S}"

    @staticmethod
    def generate_pr_body(commits: list[GitCommit]) -> str:
        # get all the commit messages from the commits in this PR, if they are auto-data events
        commit_messages = [
            commit.message
            for commit in commits
            if commit.message.startswith(COMMIT_MESSAGE_PREFIX)
        ]
        # get all `*` bullet points from the commit messages
        points = []
        for message in commit_messages:
            for line in message.splitlines():
                if line.strip().startswith("*"):
                    points.append(line)
        if points:
            body = "Contains the following events:\n\n" + "\n".join(points)
        else:
            body = ""
        return body

    def create_or_update_pr(self) -> None:
        gh = Github(auth=Auth.Token(git_settings.private_access_token))
        repo_name = self.get_repo_name()
        repo = gh.get_repo(repo_name)
        branch = self.get_current_branch()
        prs = repo.get_pulls(state="open", head=f"{repo_name.split('/')[0]}:{branch}")
        # get all the commit messages from the commits in this PR, if they are auto-data events
        commits = repo.get_commits(sha=branch)
        pr_body = self.generate_pr_body([commit.commit for commit in commits])
        if not list(prs):
            print("Creating a new PR")
            pr = repo.create_pull(
                title=f"Auto-data: Event: {datetime.now():%Y-%m-%d %H:%M:%S}",
                body=pr_body,
                base=self.master_name,
                head=branch,
            )
            print(f"PR created: {pr.html_url}")
        else:
            pr = list(prs)[0]
            print(f"PR already exists: {pr.html_url}, updating body.")
            pr.edit(body=pr_body)


def prog_init(path: Path) -> None:
    repo = Repository(path)
    repo.initialize_git_config()
    repo.reset_to_master()
    repo.destroy_all_local_branches()
    remote_auto_branches = repo.get_remote_auto_branches()
    if remote_auto_branches:
        # we use the latest remote branch, pull it and check it out
        latest_remote = remote_auto_branches[-1].removeprefix("origin/")
        repo.checkout_remote_branch(latest_remote)
        print(f"Checked out remote branch {latest_remote}")


def loop_start(path: Path) -> None:
    repo = Repository(path)
    # if auto remote exists AND it's different from current local branch, pull, check it out
    remote_auto_branches = repo.get_remote_auto_branches()
    if remote_auto_branches:
        latest_remote = remote_auto_branches[-1].removeprefix("origin/")
        current_branch = repo.get_current_branch()
        if current_branch != latest_remote:
            repo.checkout_remote_branch(latest_remote)
            print(f"Checked out remote branch {latest_remote}")
        return

    # we create a new branch
    temp_b_name = repo.create_temporary_branch()
    print(f"Created a new temporary branch {temp_b_name}")


def loop_end_with_changes(
    path: Path, files: list[Path], commit_message_body: str = ""
) -> None:
    repo = Repository(path)
    current_branch = repo.get_current_branch()
    if current_branch.startswith("tmp-"):
        repo.rename_current_branch(repo.generate_auto_branch_name())
        print(f"Renamed branch to {repo.get_current_branch()}")

    repo.commit_and_push(files, commit_message_body)
    repo.create_or_update_pr()
