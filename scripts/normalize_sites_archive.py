#!/usr/bin/env python3

import sys
import tarfile
from pathlib import PurePosixPath
from urllib.parse import quote


def encode_member_name(name: str, is_directory: bool) -> str:
    parts = PurePosixPath(name).parts
    encoded = "/".join(quote(part, safe="-._~") for part in parts)
    return f"{encoded}/" if is_directory else encoded


def normalize_archive(source_path: str, target_path: str) -> None:
    encoded_names: set[str] = set()

    with tarfile.open(source_path, "r:gz") as source:
        with tarfile.open(target_path, "w:gz", format=tarfile.PAX_FORMAT) as target:
            for member in source:
                encoded_name = encode_member_name(member.name, member.isdir())
                member.pax_headers = {}
                member.name = encoded_name
                if member.name in encoded_names:
                    raise ValueError(f"Duplicate encoded archive path: {member.name}")
                encoded_names.add(member.name)

                file_object = source.extractfile(member) if member.isfile() else None
                target.addfile(member, file_object)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(
            "usage: normalize_sites_archive.py <source.tar.gz> <target.tar.gz>"
        )

    normalize_archive(sys.argv[1], sys.argv[2])
