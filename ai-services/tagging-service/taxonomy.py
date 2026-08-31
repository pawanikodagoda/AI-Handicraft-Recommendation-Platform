# Keyword taxonomy for rule-based smart product tagging.
# Each canonical tag maps to a list of keywords/synonyms that trigger it.
# This is intentionally rule-based (no training data required) so it works
# as a Phase-1 MVP; it can be swapped for a trained NLP classifier later
# without changing the API contract in main.py.

CATEGORY_KEYWORDS = {
    "Bangle": ["bangle", "bangles", "kada", "cuff"],
    "Anklet": ["anklet", "anklets", "payal"],
    "Bracelet": ["bracelet", "bracelets", "wristband", "wrist band"],
}
DEFAULT_CATEGORY = "Bracelet"

MATERIAL_KEYWORDS = {
    "Beads": ["bead", "beads", "beaded"],
    "Crystal": ["crystal", "crystals"],
    "Glass": ["glass"],
    "Wood": ["wood", "wooden"],
    "Leather": ["leather"],
    "Silver": ["silver"],
    "Gold": ["gold", "golden"],
    "Copper": ["copper"],
    "Brass": ["brass"],
    "Thread": ["thread", "threaded"],
    "Cord": ["cord", "rope", "macrame", "macramé"],
    "Pearl": ["pearl", "pearls"],
    "Gemstone": ["gemstone", "gem stone", "stone", "stones", "quartz", "agate", "amethyst", "jade", "obsidian", "turquoise stone"],
    "Shell": ["shell", "shells", "seashell"],
    "Clay": ["clay", "polymer clay"],
    "Charm": ["charm", "charms", "pendant"],
    "Metal": ["metal", "metallic", "steel", "stainless"],
    "Cotton": ["cotton", "fabric", "cloth"],
    "Wax Cord": ["wax cord", "waxed cord", "wax thread"],
    "Elastic": ["elastic", "stretch", "stretchy"],
}

COLOR_KEYWORDS = {
    "Red": ["red", "maroon", "crimson"],
    "Blue": ["blue", "navy", "sky blue", "royal blue"],
    "Green": ["green", "olive", "mint"],
    "Yellow": ["yellow", "mustard"],
    "Pink": ["pink", "rose", "fuchsia", "magenta"],
    "Purple": ["purple", "violet", "lavender", "lilac"],
    "Black": ["black", "jet black"],
    "White": ["white", "ivory", "cream"],
    "Silver": ["silver", "grey", "gray"],
    "Gold": ["gold", "golden"],
    "Brown": ["brown", "tan", "beige", "chocolate"],
    "Orange": ["orange", "amber", "peach"],
    "Turquoise": ["turquoise", "teal", "aqua"],
    "Multicolor": ["multicolor", "multi-color", "multicolour", "rainbow", "colorful", "colourful"],
}

STYLE_TAG_KEYWORDS = {
    "Boho": ["boho", "bohemian"],
    "Minimalist": ["minimalist", "minimal", "simple", "dainty"],
    "Elegant": ["elegant", "classy", "chic", "sophisticated"],
    "Casual": ["casual", "everyday"],
    "Party": ["party", "partywear", "night out"],
    "Wedding": ["wedding", "bridal", "bride"],
    "Birthday": ["birthday"],
    "Gift": ["gift", "present", "giftable"],
    "Kids": ["kids", "kid", "children", "child"],
    "Girls": ["girls", "girl", "girly"],
    "Boys": ["boys", "boy"],
    "Men": ["men", "man", "mens", "men's", "unisex-men"],
    "Women": ["women", "woman", "womens", "women's", "ladies"],
    "Unisex": ["unisex"],
    "Traditional": ["traditional", "ethnic", "cultural"],
    "Beach": ["beach", "summer", "tropical"],
    "Statement": ["statement", "bold", "chunky"],
    "Layered": ["layered", "multi-strand", "stacked"],
    "Handmade": ["handmade", "hand-made", "handcrafted", "hand crafted"],
    "Vintage": ["vintage", "retro", "antique"],
    "Modern": ["modern", "contemporary", "trendy"],
    "Gen Z": ["gen z", "genz", "teen", "teens", "y2k"],
}
