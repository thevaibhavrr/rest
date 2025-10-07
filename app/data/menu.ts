export type MenuCategory = "starters" | "mains" | "breads" | "desserts" | "beverages";

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  image: string;
  isSignature?: boolean;
  isChefSpecial?: boolean;
};

export const CATEGORY_PRESETS = [
  {
    id: "all" as const,
    label: "All",
  },
  {
    id: "starters" as const,
    label: "Starters",
  },
  {
    id: "mains" as const,
    label: "Main Course",
  },
  {
    id: "breads" as const,
    label: "Breads",
  },
  {
    id: "desserts" as const,
    label: "Desserts",
  },
  {
    id: "beverages" as const,
    label: "Beverages",
  },
] as const;

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "ragi-poppers",
    name: "Millet Ragi Poppers",
    category: "starters",
    price: 180,
    description: "Crispy village millet bites with tamarind chutney.",
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80",
    isSignature: true,
  },
  {
    id: "smoked-paneer",
    name: "Smoked Tandoor Paneer",
    category: "starters",
    price: 240,
    description: "Charred paneer skewers brushed with forest honey glaze.",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    category: "starters",
    price: 250,
    description: "Grilled cottage cheese marinated in spicy yogurt and herbs.",
    image:
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "potato-samosa",
    name: "Potato Samosa",
    category: "starters",
    price: 120,
    description: "Golden fried pastry filled with spiced mashed potato.",
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "mahua-curry",
    name: "Mahua Blossom Curry",
    category: "mains",
    price: 320,
    description: "Slow braised seasonal vegetables in mahua flower broth.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    isChefSpecial: true,
  },
  {
    id: "millet-thali",
    name: "Village Millet Thali",
    category: "mains",
    price: 360,
    description:
      "Includes saag, spiced dal, roasted pumpkin, and buttermilk.",
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "butter-chicken",
    name: "Butter Chicken",
    category: "mains",
    price: 360,
    description: "Tender chicken pieces cooked in a creamy tomato butter sauce.",
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
    isSignature: true,
  },
  {
    id: "chicken-biryani",
    name: "Chicken Biryani",
    category: "mains",
    price: 380,
    description: "Aromatic basmati rice layered with marinated chicken and spices.",
    image:
      "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "makki-roti",
    name: "Makki Roti",
    category: "breads",
    price: 90,
    description: "Hand-rolled corn rotis brushed with white butter.",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "desi-ghee-naan",
    name: "Desi Ghee Garlic Naan",
    category: "breads",
    price: 110,
    description: "Wood-fired naan with roasted garlic and herbs.",
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "tandoori-roti",
    name: "Tandoori Roti",
    category: "breads",
    price: 80,
    description: "Whole wheat flatbread baked in a traditional clay oven.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Roti_(Indian_Flatbread)_(Unsplash).jpg/1024px-Roti_(Indian_Flatbread)_(Unsplash).jpg",
  },
  {
    id: "butter-naan",
    name: "Butter Naan",
    category: "breads",
    price: 100,
    description: "Soft buttered Indian flatbread, fresh from the tandoor.",
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "date-kheer",
    name: "Stone Pot Date Kheer",
    category: "desserts",
    price: 220,
    description: "Khajur-studded milk pudding topped with nuts.",
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
    isSignature: true,
  },
  {
    id: "gulab-jamun",
    name: "Gulab Jamun",
    category: "desserts",
    price: 200,
    description: "Deep-fried milk dumplings soaked in cardamom saffron syrup.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/24/GULAB_JAMUN.jpg",
  },
  {
    id: "ras-malai",
    name: "Ras Malai",
    category: "desserts",
    price: 220,
    description: "Soft cheese dumplings in sweetened milk flavored with saffron.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/d/df/Ras_Malai.JPG",
    isChefSpecial: true,
  },
  {
    id: "nalbari-tea",
    name: "Nalbari Smoked Tea",
    category: "beverages",
    price: 140,
    description: "Assam smoked tea served with jaggery crystals.",
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "masala-chai",
    name: "Masala Chai",
    category: "beverages",
    price: 140,
    description: "Traditional Indian tea brewed with spices and milk.",
    image:
      "https://foodandroad.com/wp-content/uploads/2021/04/masala-chai-indian-drink-3.jpg",
  },
  {
    id: "mango-lassi",
    name: "Mango Lassi",
    category: "beverages",
    price: 150,
    description: "Creamy yogurt-based mango drink, sweet and refreshing.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Lassi_de_mango.JPG",
  },
  {
    id: "buttermilk",
    name: "Kutchi Chaas",
    category: "beverages",
    price: 120,
    description: "Spiced buttermilk with roasted cumin and coriander.",
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80",
  },
];

