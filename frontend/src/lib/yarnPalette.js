// The yarn colors customers pick from for pieces made in any color. Names are
// what the order records; the hex values only draw the swatches. Customers can
// also type a color that isn't here.
export const YARN_PALETTE = [
    { name: "White", hex: "#F8F6F0" },
    { name: "Cream", hex: "#F1E6CC" },
    { name: "Beige", hex: "#D9C3A0" },
    { name: "Camel", hex: "#B98A57" },
    { name: "Brown", hex: "#6B4428" },
    { name: "Black", hex: "#1F1D1C" },
    { name: "Grey", hex: "#9A9895" },
    { name: "Baby pink", hex: "#F4C9D2" },
    { name: "Dusty rose", hex: "#C98B93" },
    { name: "Hot pink", hex: "#E0428C" },
    { name: "Red", hex: "#C3272F" },
    { name: "Burgundy", hex: "#6E1E2C" },
    { name: "Terracotta", hex: "#C0623E" },
    { name: "Orange", hex: "#EE8A2E" },
    { name: "Mustard", hex: "#D6A52C" },
    { name: "Pastel yellow", hex: "#F6E7A1" },
    { name: "Mint", hex: "#BFE3CF" },
    { name: "Sage", hex: "#A3B49A" },
    { name: "Olive", hex: "#6F7340" },
    { name: "Forest green", hex: "#2F5D3E" },
    { name: "Teal", hex: "#1F7172" },
    { name: "Baby blue", hex: "#B7D6EE" },
    { name: "Royal blue", hex: "#2C4FB5" },
    { name: "Navy", hex: "#1E2A4A" },
    { name: "Lilac", hex: "#C9B6E4" },
    { name: "Purple", hex: "#6C3E8E" },
    { name: "Gold", hex: "#C9A13B" },
    { name: "Silver", hex: "#B9BCC0" },
];

const BY_NAME = new Map(YARN_PALETTE.map((c) => [c.name.toLowerCase(), c.hex]));

/** The swatch color for a picked color name, or null for one the customer typed. */
export const swatchFor = (name) => BY_NAME.get(String(name).toLowerCase()) ?? null;

/** The colors a product offers: the studio's list, or the whole palette when it hasn't chosen. */
export function colorChoices(product) {
    const listed = product?.available_colors || [];
    return listed.length ? listed.map((name) => ({ name, hex: swatchFor(name) })) : YARN_PALETTE;
}
