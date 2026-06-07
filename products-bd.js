/* ===== BANGLADESH PRODUCT CATALOG =====
   Starter catalog — prices stored natively in BDT (Bangladeshi Taka).
   IDs start at 1001 to stay distinct from the Saudi Arabia catalog (products.js, IDs 1-68).
   Manage / replace these via the admin panel once real BD inventory is ready. */
const PRODUCTS_BD = [
  {
    id: 1001, category: "women", price: 1450, originalPrice: 2900, discount: 50,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
    rating: 4.8, ratingCount: 1240, sold: "3K+", stock: 22,
    colors: ["#e91e8c","#9c27b0","#16a34a"], sizes: ["S","M","L","XL"], tag: "bestseller",
    names: { bn: "এক্সক্লুসিভ জামদানি শাড়ি - উৎসব কালেকশন", en: "Exclusive Jamdani Saree - Festive Collection" }
  },
  {
    id: 1002, category: "women", price: 890, originalPrice: 1600, discount: 44,
    image: "https://images.unsplash.com/photo-1551163943-3f7253a97f74?w=400&q=80",
    rating: 4.6, ratingCount: 860, sold: "2K+", stock: 35,
    colors: ["#ffffff","#f8bbd0","#1565c0"], sizes: ["S","M","L","XL"], tag: "new",
    names: { bn: "কটন থ্রি-পিস সেট - গ্রীষ্মকালীন আরাম", en: "Cotton Three-Piece Set - Summer Comfort" }
  },
  {
    id: 1003, category: "women", price: 1190, originalPrice: 2100, discount: 43,
    image: "https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=400&q=80",
    rating: 4.7, ratingCount: 990, sold: "1.5K+", stock: 18,
    colors: ["#212121","#546e7a","#7c3aed"], sizes: ["S","M","L"], tag: "hot",
    names: { bn: "এমব্রয়ডারি কাজ করা ওয়ান-পিস - পার্টি স্পেশাল", en: "Embroidered One-Piece - Party Special" }
  },
  {
    id: 1004, category: "men", price: 950, originalPrice: 1700, discount: 44,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80",
    rating: 4.5, ratingCount: 720, sold: "4K+", stock: 40,
    colors: ["#ffffff","#1565c0","#37474f"], sizes: ["M","L","XL","XXL"], tag: "",
    names: { bn: "প্রিমিয়াম পাঞ্জাবি - ঈদ স্পেশাল কালেকশন", en: "Premium Panjabi - Eid Special Collection" }
  },
  {
    id: 1005, category: "men", price: 650, originalPrice: 1100, discount: 41,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
    rating: 4.4, ratingCount: 540, sold: "5K+", stock: 60,
    colors: ["#ffffff","#212121","#9e9e9e"], sizes: ["S","M","L","XL"], tag: "sale",
    names: { bn: "কটন পোলো টি-শার্ট - ক্যাজুয়াল লুক", en: "Cotton Polo T-Shirt - Casual Look" }
  },
  {
    id: 1006, category: "men", price: 1250, originalPrice: 2200, discount: 43,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80",
    rating: 4.6, ratingCount: 410, sold: "1K+", stock: 15,
    colors: ["#1565c0","#212121"], sizes: ["30","32","34","36"], tag: "new",
    names: { bn: "স্লিম ফিট ডেনিম জিন্স - প্রিমিয়াম কোয়ালিটি", en: "Slim Fit Denim Jeans - Premium Quality" }
  },
  {
    id: 1007, category: "kids", price: 520, originalPrice: 950, discount: 45,
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400&q=80",
    rating: 4.7, ratingCount: 330, sold: "2K+", stock: 50,
    colors: ["#e91e8c","#03a9f4","#ffeb3b"], sizes: ["2-3Y","4-5Y","6-7Y","8-9Y"], tag: "bestseller",
    names: { bn: "শিশুদের কার্টুন প্রিন্ট টি-শার্ট সেট", en: "Kids Cartoon Print T-Shirt Set" }
  },
  {
    id: 1008, category: "kids", price: 780, originalPrice: 1400, discount: 44,
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&q=80",
    rating: 4.5, ratingCount: 215, sold: "900+", stock: 28,
    colors: ["#f8bbd0","#90caf9"], sizes: ["1-2Y","3-4Y","5-6Y"], tag: "",
    names: { bn: "শিশুদের ফ্রক ও জামা সেট - ঈদ কালেকশন", en: "Kids Frock & Dress Set - Eid Collection" }
  },
  {
    id: 1009, category: "shoes", price: 1650, originalPrice: 2900, discount: 43,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    rating: 4.8, ratingCount: 1100, sold: "3K+", stock: 24,
    colors: ["#ffffff","#212121","#e53935"], sizes: ["39","40","41","42","43","44"], tag: "hot",
    names: { bn: "স্পোর্টস রানিং স্নিকার্স - কমফোর্ট ফিট", en: "Sports Running Sneakers - Comfort Fit" }
  },
  {
    id: 1010, category: "shoes", price: 980, originalPrice: 1700, discount: 42,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
    rating: 4.4, ratingCount: 480, sold: "1.8K+", stock: 33,
    colors: ["#5d4037","#212121"], sizes: ["40","41","42","43","44"], tag: "sale",
    names: { bn: "চামড়ার ফরমাল স্যান্ডেল - অফিস কালেকশন", en: "Leather Formal Sandals - Office Collection" }
  },
  {
    id: 1011, category: "bags", price: 1380, originalPrice: 2500, discount: 45,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    rating: 4.6, ratingCount: 390, sold: "1.2K+", stock: 19,
    colors: ["#5d4037","#212121","#e91e8c"], sizes: ["One Size"], tag: "new",
    names: { bn: "মহিলাদের লেদার হ্যান্ডব্যাগ - প্রিমিয়াম কালেকশন", en: "Women's Leather Handbag - Premium Collection" }
  },
  {
    id: 1012, category: "bags", price: 890, originalPrice: 1600, discount: 44,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    rating: 4.3, ratingCount: 260, sold: "800+", stock: 41,
    colors: ["#212121","#1565c0"], sizes: ["One Size"], tag: "",
    names: { bn: "ক্যাজুয়াল ব্যাকপ্যাক - স্কুল ও অফিস উপযোগী", en: "Casual Backpack - School & Office Friendly" }
  },
  {
    id: 1013, category: "jewelry", price: 1290, originalPrice: 2300, discount: 44,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
    rating: 4.7, ratingCount: 510, sold: "1.5K+", stock: 16,
    colors: ["#ffd700","#c0c0c0"], sizes: ["One Size"], tag: "bestseller",
    names: { bn: "রুপার নেকলেস সেট - ট্র্যাডিশনাল ডিজাইন", en: "Silver Necklace Set - Traditional Design" }
  },
  {
    id: 1014, category: "jewelry", price: 590, originalPrice: 1050, discount: 44,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
    rating: 4.4, ratingCount: 290, sold: "2K+", stock: 55,
    colors: ["#ffd700","#e91e8c"], sizes: ["One Size"], tag: "sale",
    names: { bn: "ফ্যাশন ইয়ারিং ও চুড়ি কম্বো সেট", en: "Fashion Earrings & Bangles Combo Set" }
  },
  {
    id: 1015, category: "beauty", price: 690, originalPrice: 1200, discount: 43,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
    rating: 4.5, ratingCount: 670, sold: "3K+", stock: 70,
    colors: [], sizes: [], tag: "hot",
    names: { bn: "অর্গানিক স্কিন কেয়ার গিফট সেট", en: "Organic Skin Care Gift Set" }
  },
  {
    id: 1016, category: "beauty", price: 450, originalPrice: 800, discount: 44,
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80",
    rating: 4.3, ratingCount: 380, sold: "2.5K+", stock: 90,
    colors: [], sizes: [], tag: "new",
    names: { bn: "ম্যাট লিপস্টিক কালেকশন - ৬ শেড", en: "Matte Lipstick Collection - 6 Shades" }
  },
  {
    id: 1017, category: "home", price: 1850, originalPrice: 3200, discount: 42,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80",
    rating: 4.6, ratingCount: 320, sold: "950+", stock: 14,
    colors: ["#90a4ae","#bcaaa4"], sizes: [], tag: "bestseller",
    names: { bn: "প্রিমিয়াম কটন বেডশীট সেট - ৪ পিস", en: "Premium Cotton Bedsheet Set - 4 Pieces" }
  },
  {
    id: 1018, category: "home", price: 980, originalPrice: 1700, discount: 42,
    image: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&q=80",
    rating: 4.4, ratingCount: 210, sold: "700+", stock: 26,
    colors: [], sizes: [], tag: "",
    names: { bn: "নন-স্টিক কুকওয়্যার সেট - ৫ পিস", en: "Non-Stick Cookware Set - 5 Pieces" }
  },
  {
    id: 1019, category: "electronics", price: 2450, originalPrice: 4200, discount: 42,
    image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&q=80",
    rating: 4.7, ratingCount: 1450, sold: "4K+", stock: 31,
    colors: ["#212121","#ffffff"], sizes: [], tag: "hot",
    names: { bn: "ওয়্যারলেস ব্লুটুথ ইয়ারবাডস - নয়েজ ক্যান্সেলেশন", en: "Wireless Bluetooth Earbuds - Noise Cancelling" }
  },
  {
    id: 1020, category: "electronics", price: 1690, originalPrice: 2900, discount: 42,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
    rating: 4.5, ratingCount: 880, sold: "2K+", stock: 20,
    colors: ["#212121","#1565c0"], sizes: [], tag: "sale",
    names: { bn: "স্মার্ট ওয়াচ - হেলথ ট্র্যাকার সহ", en: "Smart Watch - With Health Tracker" }
  },
  {
    id: 1021, category: "sports", price: 1190, originalPrice: 2000, discount: 41,
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
    rating: 4.4, ratingCount: 240, sold: "1K+", stock: 38,
    colors: ["#212121","#e53935","#1565c0"], sizes: ["S","M","L","XL"], tag: "new",
    names: { bn: "জিম ও ফিটনেস ট্র্যাকস্যুট সেট", en: "Gym & Fitness Tracksuit Set" }
  },
  {
    id: 1022, category: "sports", price: 690, originalPrice: 1200, discount: 43,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    rating: 4.3, ratingCount: 180, sold: "850+", stock: 47,
    colors: ["#212121","#90a4ae"], sizes: [], tag: "",
    names: { bn: "যোগব্যায়াম ম্যাট ও এক্সারসাইজ কিট", en: "Yoga Mat & Exercise Kit" }
  },
  {
    id: 1023, category: "women", price: 760, originalPrice: 1400, discount: 46,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80",
    rating: 4.5, ratingCount: 430, sold: "1.6K+", stock: 29,
    colors: ["#e91e8c","#212121","#7c3aed"], sizes: ["S","M","L","XL"], tag: "sale",
    names: { bn: "স্টাইলিশ হিজাব ও স্কার্ফ কম্বো প্যাক", en: "Stylish Hijab & Scarf Combo Pack" }
  },
  {
    id: 1024, category: "men", price: 540, originalPrice: 950, discount: 43,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80",
    rating: 4.2, ratingCount: 190, sold: "1.1K+", stock: 53,
    colors: ["#212121","#5d4037"], sizes: ["One Size"], tag: "",
    names: { bn: "চামড়ার ওয়ালেট ও বেল্ট কম্বো সেট", en: "Leather Wallet & Belt Combo Set" }
  },
  {
    id: 1025, category: "home", price: 1290, originalPrice: 2300, discount: 44,
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&q=80",
    rating: 4.6, ratingCount: 260, sold: "640+", stock: 12,
    colors: [], sizes: [], tag: "bestseller",
    names: { bn: "এলইডি স্মার্ট টেবিল ল্যাম্প - রিচার্জেবল", en: "LED Smart Table Lamp - Rechargeable" }
  },
  {
    id: 1026, category: "beauty", price: 350, originalPrice: 650, discount: 46,
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80",
    rating: 4.3, ratingCount: 320, sold: "2.3K+", stock: 80,
    colors: [], sizes: [], tag: "hot",
    names: { bn: "হারবাল হেয়ার অয়েল ও শ্যাম্পু সেট", en: "Herbal Hair Oil & Shampoo Set" }
  },
  {
    id: 1027, category: "electronics", price: 950, originalPrice: 1650, discount: 42,
    image: "https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=400&q=80",
    rating: 4.4, ratingCount: 540, sold: "1.9K+", stock: 36,
    colors: ["#212121","#ffffff"], sizes: [], tag: "new",
    names: { bn: "ফাস্ট চার্জিং পাওয়ার ব্যাংক - ২০০০০mAh", en: "Fast Charging Power Bank - 20000mAh" }
  },
  {
    id: 1028, category: "sale", price: 99, originalPrice: 990, discount: 90,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80",
    rating: 4.9, ratingCount: 5200, sold: "20K+", stock: 500, tag: "hot",
    colors: ["#e91e8c","#f59e0b","#16a34a"], sizes: ["One Size"],
    description: "ফ্ল্যাশ সেল! মাত্র ৯৯ টাকায় যেকোনো একটি পণ্য — সীমিত সময়ের অফার!",
    names: { bn: "ফ্ল্যাশ সেল — মাত্র ৯৯ টাকা! সীমিত সময়ের অফার", en: "Flash Sale — Only ৳99! Limited Time Offer" }
  },
  {
    id: 1029, category: "mystery", price: 450, originalPrice: 1500, discount: 70,
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80",
    rating: 4.5, ratingCount: 1800, sold: "8K+", stock: 200, tag: "bestseller",
    description: "ফ্যাশন, বিউটি বা গ্যাজেট মিস্ট্রি বক্স — কমপক্ষে ১৫০০ টাকার পণ্য, চমকে দেওয়ার মতো দামে!",
    names: { bn: "প্রিমিয়াম মিস্ট্রি বক্স - চমক উপহার", en: "Premium Mystery Box - Surprise Gift" }
  },
  {
    id: 1030, category: "kids", price: 690, originalPrice: 1250, discount: 45,
    image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80",
    rating: 4.6, ratingCount: 270, sold: "1.3K+", stock: 34,
    colors: ["#03a9f4","#e91e8c","#ffeb3b"], sizes: ["One Size"], tag: "",
    names: { bn: "শিশুদের শিক্ষামূলক খেলনা সেট", en: "Kids Educational Toy Set" }
  }
];
