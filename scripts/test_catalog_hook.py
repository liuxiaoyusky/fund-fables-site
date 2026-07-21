from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from scripts.catalog_hook import build_catalog, iter_leaves


class CatalogHookTests(unittest.TestCase):
    def test_mixed_depth_and_natural_sort(self):
        with TemporaryDirectory() as tmp:
            source = Path(tmp)
            files = {
                "02-第二章/10-第十节/01-故事.md": "# 第十节故事",
                "02-第二章/02-第二节/01-故事.md": "# 第二节故事",
                "01-第一章/03-章下直叶.md": "# 章下直叶",
                "01-第一章/01-第一节/01-嵌套叶.md": "# 嵌套叶",
                "01-第一章/01-第一节.md": "# 第一节概览故事",
                "index.md": "# landing",
                "catalog.md": "# catalog",
            }
            for relative, content in files.items():
                path = source / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding="utf-8")

            tree = build_catalog(source, "fables/demo")
            leaves = list(iter_leaves(tree))

            self.assertEqual(tree.story_count, 5)
            self.assertEqual([node.number for node in tree.children], ["01", "02"])
            self.assertEqual(
                [child.number for child in tree.children[1].children],
                ["02", "10"],
            )
            self.assertEqual(
                {leaf.id for leaf in leaves},
                {
                    "01-第一章/01-第一节/01-嵌套叶",
                    "01-第一章/01-第一节",
                    "01-第一章/03-章下直叶",
                    "02-第二章/02-第二节/01-故事",
                    "02-第二章/10-第十节/01-故事",
                },
            )


if __name__ == "__main__":
    unittest.main()
