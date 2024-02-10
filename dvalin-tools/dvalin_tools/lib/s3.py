import json
from asyncio import to_thread
from collections import defaultdict
from io import BytesIO
from typing import Final
from urllib.parse import urlunsplit

from httpx import URL, AsyncClient, Client
from minio import Minio, S3Error

from dvalin_tools.lib.common import determine_content_type
from dvalin_tools.lib.settings import DvalinSettings


class S3Client:
    KNOWN_BUCKET: Final[str] = "event"

    def __init__(self, settings: DvalinSettings):
        self.client = Minio(
            settings.s3_endpoint,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
        )
        self.s3_endpoint: str = urlunsplit(
            self.client._base_url.build("GET", self.client._get_region("event"))
        ).removesuffix("/")
        self.initialized_buckets = set()

    @staticmethod
    def get_default_policy(bucket_name: str) -> dict:
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}"],
                },
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                },
            ],
        }

    def list_subdir_details(self, bucket_name: str) -> list[tuple[str, int, int]]:
        """
        List subdirectories up to depth 2 in the given bucket, including the count of objects
        and the total size of objects in each subdir.

        Args:
            bucket_name: The name of the bucket to list subdirectories from.

        Returns:
            A list where each item is a tuple containing the subdir name,
            the count of objects in the subdir, and the total size of these objects.
        """
        subdir_stats = defaultdict(lambda: {"count": 0, "size": 0})

        objects = self.client.list_objects(bucket_name, recursive=True)

        for obj in objects:
            path_parts = obj.object_name.split("/")
            if len(path_parts) > 1:
                subdir = "/".join(path_parts[:2])  # Get only up to the second level
                subdir_stats[subdir]["count"] += 1
                subdir_stats[subdir]["size"] += obj.size

        return [
            (subdir, details["count"], details["size"])
            for subdir, details in subdir_stats.items()
        ]

    def initialize_bucket(self, bucket_name: str) -> None:
        if bucket_name not in self.initialized_buckets:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
            self._initialize_bucket_policy(bucket_name)
            self.initialized_buckets.add(bucket_name)

    def _initialize_bucket_policy(self, bucket_name: str) -> None:
        try:
            self.client.get_bucket_policy(bucket_name)
        except S3Error:
            self.client.set_bucket_policy(
                bucket_name,
                json.dumps(self.get_default_policy(bucket_name)),
            )

    def upload_file(
        self,
        s3_full_path: str,
        content: BytesIO,
        *,
        content_type: str = "application/octet-stream",
    ) -> URL:
        bucket_name, s3_path = s3_full_path.lower().split("/", 1)
        self.initialize_bucket(bucket_name)
        content.seek(0)
        self.client.put_object(
            bucket_name=bucket_name,
            object_name=s3_path,
            data=content,
            length=content.getbuffer().nbytes,
            content_type=content_type,
        )
        return URL(f"{self.s3_endpoint}/{s3_full_path}")

    def upload_from_remote(
        self, s3_full_path: str, remote_url: URL, client: Client
    ) -> URL:
        response = client.get(remote_url)
        content_type = determine_content_type(response.headers, response.url)
        url = self.upload_file(
            s3_full_path, BytesIO(response.content), content_type=content_type
        )
        return url

    async def async_upload_file(
        self,
        s3_full_path: str,
        content: BytesIO,
        *,
        content_type: str = "application/octet-stream",
    ) -> URL:
        url = await to_thread(
            self.upload_file, s3_full_path, content, content_type=content_type
        )
        return url

    async def async_upload_from_remote(
        self, remote_url: URL, s3_full_path: str, *, client: AsyncClient
    ) -> URL:
        response = await client.get(remote_url)
        content_type = determine_content_type(response.headers, response.url)
        url = await self.async_upload_file(
            s3_full_path, BytesIO(response.content), content_type=content_type
        )
        return url
