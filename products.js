const PRODUCTS = [
  {
    id: 1, category: "women", price: 649, originalPrice: 1299, discount: 50,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80",
    rating: 4.8, ratingCount: 2340, sold: "10K+",
    colors: ["#e91e8c","#9c27b0","#2196f3","#4caf50"], sizes: ["S","M","L","XL","XXL"], tag: "bestseller",
    names: { bn: "ফ্লোরাল প্রিন্ট মিডি ড্রেস - গ্রীষ্মকালীন কালেকশন", en: "Floral Print Midi Dress - Summer Collection", ar: "فستان ميدي بطباعة زهرية - كولكشن الصيف", hi: "फ्लोरल प्रिंट मिडी ड्रेस - समर कलेक्शन" }
  },
  {
    id: 2, category: "women", price: 399, originalPrice: 799, discount: 50,
    image: "https://images.unsplash.com/photo-1551163943-3f7253a97f74?w=400&q=80",
    rating: 4.6, ratingCount: 1200, sold: "5K+",
    colors: ["#ffffff","#f8bbd0","#bbdefb"], sizes: ["XS","S","M","L"], tag: "new",
    names: { bn: "কটন কাজু ব্লাউজ - ক্যাজুয়াল উইকেন্ড", en: "Cotton Casual Blouse - Weekend Wear", ar: "بلوزة قطنية كاجوال - ملابس عطلة الأسبوع", hi: "कॉटन कैज़ुअल ब्लाउज़ - वीकेंड वेयर" }
  },
  {
    id: 3, category: "women", price: 849, originalPrice: 1500, discount: 43,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    rating: 4.7, ratingCount: 3100, sold: "15K+",
    colors: ["#1565c0","#212121","#546e7a"], sizes: ["26","28","30","32","34"], tag: "hot",
    names: { bn: "হাই ওয়েস্ট স্কিনি জিন্স - ট্রেন্ডি লুক", en: "High Waist Skinny Jeans - Trendy Look", ar: "جينز ضيق بخصر عالٍ - إطلالة عصرية", hi: "हाई वेस्ट स्किनी जींस - ट्रेंडी लुक" }
  },
  {
    id: 4, category: "women", price: 1199, originalPrice: 2400, discount: 50,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
    rating: 4.9, ratingCount: 890, sold: "3K+",
    colors: ["#e91e8c","#ff9800","#4caf50"], sizes: ["S","M","L","XL"], tag: "sale",
    names: { bn: "এমব্রয়ডারি কুর্তি সেট - উৎসব স্পেশাল", en: "Embroidery Kurti Set - Festival Special", ar: "طقم كورتي مطرز - خاص بالأعياد", hi: "कढ़ाई वाला कुर्ती सेट - त्योहार स्पेशल" }
  },
  {
    id: 5, category: "men", price: 549, originalPrice: 999, discount: 45,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80",
    rating: 4.5, ratingCount: 1800, sold: "8K+",
    colors: ["#ffffff","#1565c0","#37474f","#f44336"], sizes: ["S","M","L","XL","XXL"], tag: "",
    names: { bn: "স্লিম ফিট কটন শার্ট - অফিস কালেকশন", en: "Slim Fit Cotton Shirt - Office Collection", ar: "قميص قطني سليم فيت - كولكشن المكتب", hi: "स्लिम फिट कॉटन शर्ट - ऑफिस कलेक्शन" }
  },
  {
    id: 6, category: "men", price: 799, originalPrice: 1400, discount: 43,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80",
    rating: 4.4, ratingCount: 960, sold: "4K+",
    colors: ["#795548","#212121","#607d8b"], sizes: ["28","30","32","34","36"], tag: "new",
    names: { bn: "কার্গো প্যান্ট - স্ট্রিটওয়্যার এডিশন", en: "Cargo Pants - Streetwear Edition", ar: "بنطلون كارجو - إصدار ستريت وير", hi: "कार्गो पैंट - स्ट्रीटवेयर एडिशन" }
  },
  {
    id: 7, category: "men", price: 699, originalPrice: 1200, discount: 42,
    image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&q=80",
    rating: 4.6, ratingCount: 2200, sold: "12K+",
    colors: ["#ffffff","#212121","#1565c0","#e91e8c"], sizes: ["S","M","L","XL"], tag: "bestseller",
    names: { bn: "পোলো টি-শার্ট প্যাক অব থ্রি - ডেইলি ওয়্যার", en: "Polo T-Shirt Pack of Three - Daily Wear", ar: "حزمة تي شيرت بولو 3 قطع - ملابس يومية", hi: "पोलो टी-शर्ट 3 का पैक - डेली वेयर" }
  },
  {
    id: 8, category: "men", price: 1499, originalPrice: 2800, discount: 46,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80",
    rating: 4.8, ratingCount: 560, sold: "2K+",
    colors: ["#212121","#37474f","#1a237e"], sizes: ["S","M","L","XL","XXL"], tag: "hot",
    names: { bn: "ফর্মাল ব্লেজার - বিজনেস লুক", en: "Formal Blazer - Business Look", ar: "بليزر رسمي - إطلالة الأعمال", hi: "फॉर्मल ब्लेज़र - बिज़नेस लुक" }
  },
  {
    id: 9, category: "kids", price: 249, originalPrice: 499, discount: 50,
    image: "https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=400&q=80",
    rating: 4.7, ratingCount: 1500, sold: "7K+",
    colors: ["#f44336","#2196f3","#4caf50","#ff9800"], sizes: ["2Y","3Y","4Y","5Y","6Y"], tag: "sale",
    names: { bn: "কিউট কার্টুন টি-শার্ট - বাচ্চাদের পছন্দের", en: "Cute Cartoon T-Shirt - Kids Favorite", ar: "تي شيرت كرتوني لطيف - المفضل عند الأطفال", hi: "क्यूट कार्टून टी-शर्ट - बच्चों का पसंदीदा" }
  },
  {
    id: 10, category: "kids", price: 599, originalPrice: 1100, discount: 45,
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&q=80",
    rating: 4.9, ratingCount: 730, sold: "3K+",
    colors: ["#e91e8c","#9c27b0","#f8bbd0"], sizes: ["3Y","4Y","5Y","6Y","7Y"], tag: "new",
    names: { bn: "গার্লস পার্টি ড্রেস - জন্মদিন স্পেশাল", en: "Girls Party Dress - Birthday Special", ar: "فستان سهرة للبنات - خاص بأعياد الميلاد", hi: "गर्ल्स पार्टी ड्रेस - जन्मदिन स्पेशल" }
  },
  {
    id: 11, category: "beauty", price: 349, originalPrice: 700, discount: 50,
    image: "https://images.unsplash.com/photo-1586495777744-4e6232bf2b93?w=400&q=80",
    rating: 4.7, ratingCount: 4200, sold: "20K+",
    colors: ["#e91e8c","#f44336","#e57373","#c2185b"], sizes: ["One Size"], tag: "bestseller",
    names: { bn: "ম্যাট লিপস্টিক কালেকশন - ১২ শেড", en: "Matte Lipstick Collection - 12 Shades", ar: "كولكشن أحمر الشفاه المات - 12 درجة", hi: "मैट लिपस्टिक कलेक्शन - 12 शेड्स" }
  },
  {
    id: 12, category: "beauty", price: 299, originalPrice: 550, discount: 46,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
    rating: 4.8, ratingCount: 3800, sold: "18K+",
    colors: ["#ffffff"], sizes: ["50ml","100ml"], tag: "hot",
    names: { bn: "সানস্ক্রিন SPF 50+ - ত্বকের যত্ন", en: "Sunscreen SPF 50+ - Skin Care", ar: "واقي شمس SPF 50+ - العناية بالبشرة", hi: "सनस्क्रीन SPF 50+ - स्किन केयर" }
  },
  {
    id: 13, category: "shoes", price: 999, originalPrice: 1999, discount: 50,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    rating: 4.6, ratingCount: 2100, sold: "9K+",
    colors: ["#ffffff","#212121","#f44336","#1565c0"], sizes: ["38","39","40","41","42","43","44"], tag: "bestseller",
    names: { bn: "ক্যাজুয়াল স্নিকার - কমফোর্ট কালেকশন", en: "Casual Sneaker - Comfort Collection", ar: "حذاء سنيكر كاجوال - كولكشن مريح", hi: "कैज़ुअल स्नीकर - कम्फर्ट कलेक्शन" }
  },
  {
    id: 14, category: "shoes", price: 799, originalPrice: 1500, discount: 47,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
    rating: 4.5, ratingCount: 900, sold: "4K+",
    colors: ["#212121","#795548","#ffd700"], sizes: ["36","37","38","39","40"], tag: "new",
    names: { bn: "হিল স্যান্ডেল - পার্টি ওয়্যার", en: "Heel Sandal - Party Wear", ar: "صندل بكعب - ملابس الحفلات", hi: "हील सैंडल - पार्टी वेयर" }
  },
  {
    id: 15, category: "bags", price: 1299, originalPrice: 2500, discount: 48,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
    rating: 4.8, ratingCount: 1600, sold: "6K+",
    colors: ["#795548","#212121","#c2185b"], sizes: ["One Size"], tag: "hot",
    names: { bn: "লেদার টোট ব্যাগ - ওয়ার্কপ্লেস এসেনশিয়াল", en: "Leather Tote Bag - Workplace Essential", ar: "حقيبة توت جلدية - أساسيات العمل", hi: "लेदर टोट बैग - वर्कप्लेस एसेंशियल" }
  },
  {
    id: 16, category: "bags", price: 599, originalPrice: 1100, discount: 46,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80",
    rating: 4.6, ratingCount: 2700, sold: "11K+",
    colors: ["#e91e8c","#212121","#ffffff","#9c27b0"], sizes: ["One Size"], tag: "sale",
    names: { bn: "মিনি ক্রসবডি ব্যাগ - ট্রেন্ডি স্টাইল", en: "Mini Crossbody Bag - Trendy Style", ar: "حقيبة كروس بودي صغيرة - ستايل عصري", hi: "मिनी क्रॉसबॉडी बैग - ट्रेंडी स्टाइल" }
  },
  {
    id: 17, category: "jewelry", price: 449, originalPrice: 900, discount: 50,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
    rating: 4.7, ratingCount: 3300, sold: "16K+",
    colors: ["#ffd700","#c0c0c0"], sizes: ["One Size"], tag: "bestseller",
    names: { bn: "গোল্ড প্লেটেড নেকলেস সেট - ৩ পিস", en: "Gold Plated Necklace Set - 3 Pieces", ar: "طقم قلادة مطلية بالذهب - 3 قطع", hi: "गोल्ड प्लेटेड नेकलेस सेट - 3 पीस" }
  },
  {
    id: 18, category: "jewelry", price: 199, originalPrice: 400, discount: 50,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80",
    rating: 4.5, ratingCount: 1400, sold: "7K+",
    colors: ["#e91e8c","#9c27b0","#2196f3","#4caf50"], sizes: ["One Size"], tag: "new",
    names: { bn: "স্টোন ব্রেসলেট - বোহেমিয়ান ভাইব", en: "Stone Bracelet - Bohemian Vibe", ar: "سوار حجري - إطلالة بوهيمية", hi: "स्टोन ब्रेसलेट - बोहेमियन वाइब" }
  },
  {
    id: 19, category: "home", price: 1099, originalPrice: 2000, discount: 45,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80",
    rating: 4.8, ratingCount: 900, sold: "4K+",
    colors: ["#ffffff","#f8bbd0","#bbdefb","#c8e6c9"], sizes: ["King","Queen","Single"], tag: "",
    names: { bn: "কটন বেড শিট সেট - কিং সাইজ", en: "Cotton Bed Sheet Set - King Size", ar: "طقم ملاءات قطنية - مقاس كينج", hi: "कॉटन बेड शीट सेट - किंग साइज़" }
  },
  {
    id: 20, category: "home", price: 349, originalPrice: 650, discount: 46,
    image: "https://images.unsplash.com/photo-1602178741583-49b0f2e3f7b6?w=400&q=80",
    rating: 4.6, ratingCount: 1100, sold: "5K+",
    colors: ["#ffffff","#f8bbd0","#fff9c4"], sizes: ["One Size"], tag: "new",
    names: { bn: "অ্যারোমা ক্যান্ডেল সেট - রিল্যাক্সেশন", en: "Aroma Candle Set - Relaxation", ar: "طقم شموع عطرية - للاسترخاء", hi: "अरोमा कैंडल सेट - रिलैक्सेशन" }
  },
  {
    id: 21, category: "electronics", price: 1599, originalPrice: 2999, discount: 47,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
    rating: 4.7, ratingCount: 5600, sold: "25K+",
    colors: ["#ffffff","#212121","#1565c0"], sizes: ["One Size"], tag: "hot",
    names: { bn: "ওয়্যারলেস ইয়ারবাড - নয়েজ ক্যান্সেলিং", en: "Wireless Earbuds - Noise Cancelling", ar: "سماعات لاسلكية - إلغاء الضوضاء", hi: "वायरलेस ईयरबड्स - नॉइज़ कैंसेलिंग" }
  },
  {
    id: 22, category: "electronics", price: 2499, originalPrice: 4500, discount: 44,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    rating: 4.5, ratingCount: 3400, sold: "14K+",
    colors: ["#212121","#ffffff","#1565c0","#e91e8c"], sizes: ["42mm","46mm"], tag: "bestseller",
    names: { bn: "স্মার্টওয়াচ - ফিটনেস ট্র্যাকার", en: "Smartwatch - Fitness Tracker", ar: "ساعة ذكية - تتبع اللياقة البدنية", hi: "स्मार्टवॉच - फिटनेस ट्रैकर" }
  },
  {
    id: 23, category: "sports", price: 699, originalPrice: 1300, discount: 46,
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80",
    rating: 4.8, ratingCount: 2100, sold: "9K+",
    colors: ["#212121","#1565c0","#e91e8c","#4caf50"], sizes: ["XS","S","M","L","XL"], tag: "hot",
    names: { bn: "ইয়োগা প্যান্ট - হাই ওয়েস্ট ফ্লেক্সি", en: "Yoga Pants - High Waist Flexi", ar: "بنطلون يوجا - خصر عالٍ مرن", hi: "योगा पैंट - हाई वेस्ट फ्लेक्सी" }
  },
  {
    id: 24, category: "sports", price: 299, originalPrice: 550, discount: 46,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80",
    rating: 4.6, ratingCount: 4500, sold: "22K+",
    colors: ["#2196f3","#212121","#4caf50","#f44336"], sizes: ["500ml","1L"], tag: "bestseller",
    names: { bn: "স্পোর্টস ওয়াটার বটল - ১ লিটার BPA ফ্রি", en: "Sports Water Bottle - 1L BPA Free", ar: "زجاجة مياه رياضية - 1 لتر خالية من BPA", hi: "स्पोर्ट्स वाटर बोतल - 1 लीटर BPA फ्री" }
  }
];
