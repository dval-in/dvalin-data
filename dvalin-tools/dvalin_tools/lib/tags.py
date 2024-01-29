import re
from enum import Enum, auto

# "Is there time to sneak in some dim sum first?" — "Leonine Vanguard" Gaming
TAG_NEW_CHARACTER_INTRO = re.compile(r"""".*" — ".*" (?P<name>.*)""")
# Voice Artist Announcement
TAG_VOICE_ARTIST_ANNOUNCEMENT = re.compile(r"""Voice Artist Announcement""")
# Version 4.4 Event Wishes Notice - Phase I
TAG_VERSION_EVENT_WISHES_NOTICE = re.compile(
    r"""Version (?P<version>\d\.\d) Event\s+Wishes Notice - Phase (?P<phase>.*)"""
)
# Version 4.4 Event  Notices Compilation (1)
TAG_VERSION_EVENT_NOTICES_COMPILATION = re.compile(
    r"""Version (?P<version>\d\.\d) Event\s+Notices Compilation"""
)
# Character Demo - "Gaming: Fortune Shines in Many Colors" | Genshin Impact
TAG_CHARACTER_DEMO = re.compile(
    r"""Character Demo - "(?P<name>.*): .*" \| Genshin Impact"""
)
# Character Teaser - "Xianyun: Discernment and Ingenuity" | Genshin Impact
TAG_CHARACTER_TEASER = re.compile(
    r"""Character Teaser - "(?P<name>.*): .*" \| Genshin Impact"""
)
# "Grus Serena Chapter" Story Quest  Overview
TAG_STORY_QUEST = re.compile(r"""Story Quest""")
# Version 4.4 "Vibrant Harriers Aloft in Spring Breeze" New Weapon Overview
TAG_VERSION_NEW_WEAPON = re.compile(
    r"""Version (?P<version>\d\.\d) .* New Weapon Overview"""
)
# "An outfit for a banquet... Mm, yes, this one will do." – Ganyu's New Outfit Showcase "Twilight Blossom"
TAG_NEW_OUTFIT = re.compile(r'''(?P<name>.*)'s? New Outfit Showcase "(?P<outfit>.*)"''')
# Outfit Teaser: Teyvat Style – Bathed in Heavenly Moonlight | Genshin Impact
TAG_OUTFIT_TEASER = re.compile(
    r"""Outfit Teaser: (?P<name>.*) – (?P<outfit>.*) \| Genshin Impact"""
)
# "Chenyu Anecdotes": Version 4.4 New Contents Display Page Now Available!
TAG_NEW_CONTENTS_DISPLAY = re.compile(
    r"""Version (?P<version>\d\.\d) New Contents Display Page Now Available!"""
)
# Genshin Impact "Lean, Mean, Cleaning Machine!" Web Event Wallpapers Showcase
TAG_WEB_EVENT_WALLPAPERS = re.compile(r"""Web Event Wallpapers""")
# Genshin Impact Version 4.4 Preview
TAG_VERSION_PREVIEW = re.compile(
    r"""Genshin Impact Version (?P<version>\d\.\d) Preview"""
)
# "Marvelous Merchandise" Event: Open Boxes o' Marvels and Get Primogems
TAG_EVENT = re.compile(r""""(?P<name>.*)" Event: """)
# Version 4.4 "Vibrant Harriers Aloft in Spring Breeze" Trailer | Genshin Impact
TAG_VERSION_TRAILER = re.compile(
    r"""Version (?P<version>\d\.\d) ".*" Trailer \| Genshin Impact"""
)
# Genshin Impact Character OST Album - The Stellar Moments Vol. 4
TAG_OST_ALBUM = re.compile(r"""OST Album""")
# Version 4.4 Special Program Preview
TAG_SPECIAL_PROGRAM_PREVIEW = re.compile(
    r"""Version (?P<version>\d\.\d) Special Program Preview"""
)
# Fast Equip Artifacts, Serenitea  Pot Optimizations, and System & Function Updates | Developers Discussion  - 01/17
TAG_DEVELOPERS_DISCUSSION = re.compile(r"""Developers Discussion""")
# Collected Miscellany - "Chevreuse: Compliance Is Imperative" | Genshin Impact
TAG_COLLECTED_MISCELLANY = re.compile(
    r"""Collected Miscellany - "(?P<name>.*): .*" \| Genshin Impact"""
)
# Version 4.3 Events Preview - Phase  II
TAG_VERSION_EVENTS_PREVIEW = re.compile(
    r"""Version (?P<version>\d\.\d) Events Preview - Phase\s+(?P<phase>.*)"""
)
# Genshin Impact X Sanxingdui Museum Collaboration Event Teaser
TAG_EVENT_TEASER = re.compile(r"""Event Teaser""")
# Version 4.3 "Roses and Muskets" New Artifact Overview
TAG_VERSION_NEW_ARTIFACT = re.compile(
    r"""Version (?P<version>\d\.\d) ".*" New Artifact Overview"""
)
# Artifact Auto-Lock and Filter Function Update Preview
TAG_UPDATE_PREVIEW = re.compile(r"""Update Preview""")
# Version 4.4 "Genius Invokation TCG" Update Details
TAG_UPDATE_DETAILS = re.compile(r"""Update Details""")
# "Ley Line Overflow" Event - Double Drops From Blossoms of Wealth and Blossoms of Revelation!
TAG_LEY_LINE_OVERFLOW = re.compile(r"""Ley Line Overflow""")
# The "Masquerade of the Guilty" wallpaper series is now available!
TAG_WALLPAPERS = re.compile(r"""wallpaper""", flags=re.IGNORECASE)
# Genius Invokation TCG
TAG_GENIUS_INVOKATION_TCG = re.compile(r"""Genius Invokation TCG""")
# Cutscene Animation: "The Two Musketeers" | Genshin Impact
TAG_CUTSCENE_ANIMATION = re.compile(r"""Cutscene Animation""")
# GENSHIN CONCERT 2023 Is About to Begin!
TAG_GENSHIN_CONCERT = re.compile(r"""GENSHIN CONCERT""", flags=re.IGNORECASE)
# The Version 4.3 "Roses and Muskets" Preview page is here!
TAG_VERSION_PREVIEW_PAGE = re.compile(r"""Version (?P<version>\d\.\d) Preview""")
# #Impact4Music: "Music From Teyvat" Benefit Concert at Vienna's Musikverein Highlights
TAG_MUSIC = re.compile(r"""music""", flags=re.IGNORECASE)


REPLACE_SPACES = re.compile(r"\s+")


class Tags(Enum):
    NEW_CHARACTER_INTRO = auto()
    VOICE_ARTIST_ANNOUNCEMENT = auto()
    VERSION_EVENT_WISHES_NOTICE = auto()
    VERSION_EVENT_NOTICES_COMPILATION = auto()
    CHARACTER_DEMO = auto()
    CHARACTER_TEASER = auto()
    STORY_QUEST = auto()
    VERSION_NEW_WEAPON = auto()
    NEW_OUTFIT = auto()
    OUTFIT_TEASER = auto()
    NEW_CONTENTS_DISPLAY = auto()
    WEB_EVENT_WALLPAPERS = auto()
    VERSION_PREVIEW = auto()
    EVENT = auto()
    VERSION_TRAILER = auto()
    OST_ALBUM = auto()
    SPECIAL_PROGRAM_PREVIEW = auto()
    DEVELOPERS_DISCUSSION = auto()
    COLLECTED_MISCELLANY = auto()
    VERSION_EVENTS_PREVIEW = auto()
    EVENT_TEASER = auto()
    VERSION_NEW_ARTIFACT = auto()
    UPDATE_PREVIEW = auto()
    UPDATE_DETAILS = auto()
    LEY_LINE_OVERFLOW = auto()
    WALLPAPERS = auto()
    GENIUS_INVOKATION_TCG = auto()
    CUTSCENE_ANIMATION = auto()
    GENSHIN_CONCERT_2023 = auto()
    VERSION_PREVIEW_PAGE = auto()
    MUSIC = auto()


TAGS = {
    TAG_NEW_CHARACTER_INTRO: Tags.NEW_CHARACTER_INTRO,
    TAG_VOICE_ARTIST_ANNOUNCEMENT: Tags.VOICE_ARTIST_ANNOUNCEMENT,
    TAG_VERSION_EVENT_WISHES_NOTICE: Tags.VERSION_EVENT_WISHES_NOTICE,
    TAG_VERSION_EVENT_NOTICES_COMPILATION: Tags.VERSION_EVENT_NOTICES_COMPILATION,
    TAG_CHARACTER_DEMO: Tags.CHARACTER_DEMO,
    TAG_CHARACTER_TEASER: Tags.CHARACTER_TEASER,
    TAG_STORY_QUEST: Tags.STORY_QUEST,
    TAG_VERSION_NEW_WEAPON: Tags.VERSION_NEW_WEAPON,
    TAG_NEW_OUTFIT: Tags.NEW_OUTFIT,
    TAG_OUTFIT_TEASER: Tags.OUTFIT_TEASER,
    TAG_NEW_CONTENTS_DISPLAY: Tags.NEW_CONTENTS_DISPLAY,
    TAG_WEB_EVENT_WALLPAPERS: Tags.WEB_EVENT_WALLPAPERS,
    TAG_VERSION_PREVIEW: Tags.VERSION_PREVIEW,
    TAG_EVENT: Tags.EVENT,
    TAG_VERSION_TRAILER: Tags.VERSION_TRAILER,
    TAG_OST_ALBUM: Tags.OST_ALBUM,
    TAG_SPECIAL_PROGRAM_PREVIEW: Tags.SPECIAL_PROGRAM_PREVIEW,
    TAG_DEVELOPERS_DISCUSSION: Tags.DEVELOPERS_DISCUSSION,
    TAG_COLLECTED_MISCELLANY: Tags.COLLECTED_MISCELLANY,
    TAG_VERSION_EVENTS_PREVIEW: Tags.VERSION_EVENTS_PREVIEW,
    TAG_EVENT_TEASER: Tags.EVENT_TEASER,
    TAG_VERSION_NEW_ARTIFACT: Tags.VERSION_NEW_ARTIFACT,
    TAG_UPDATE_PREVIEW: Tags.UPDATE_PREVIEW,
    TAG_UPDATE_DETAILS: Tags.UPDATE_DETAILS,
    TAG_LEY_LINE_OVERFLOW: Tags.LEY_LINE_OVERFLOW,
    TAG_WALLPAPERS: Tags.WALLPAPERS,
    TAG_GENIUS_INVOKATION_TCG: Tags.GENIUS_INVOKATION_TCG,
    TAG_CUTSCENE_ANIMATION: Tags.CUTSCENE_ANIMATION,
    TAG_GENSHIN_CONCERT: Tags.GENSHIN_CONCERT_2023,
    TAG_VERSION_PREVIEW_PAGE: Tags.VERSION_PREVIEW_PAGE,
    TAG_MUSIC: Tags.MUSIC,
}


def get_tags_from_subject(subject: str) -> set[Tags]:
    tags = set()
    for regex, tag in TAGS.items():
        subject_clean = REPLACE_SPACES.sub(" ", subject)
        match = regex.search(subject_clean)
        if match:
            tags.add(tag)

    return tags
