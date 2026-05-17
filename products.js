const PRODUCTS = [
  {
    id: 1, category: "women", price: 649, originalPrice: 1299, discount: 50,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80",
    rating: 4.8, ratingCount: 2340, sold: "10K+", stock: 8,
    colors: ["#e91e8c","#9c27b0","#2196f3","#4caf50"], sizes: ["S","M","L","XL","XXL"], tag: "bestseller",
    video: "mhZ1g5x-m2g",
    names: { bn: "ফ্লোরাল প্রিন্ট মিডি ড্রেস - গ্রীষ্মকালীন কালেকশন", en: "Floral Print Midi Dress - Summer Collection", ar: "فستان ميدي بطباعة زهرية - كولكشن الصيف", hi: "फ्लोरल प्रिंट मिडी ड्रेस - समर कलेक्शन" }
  },
  {
    id: 2, category: "women", price: 399, originalPrice: 799, discount: 50,
    image: "https://images.unsplash.com/photo-1551163943-3f7253a97f74?w=400&q=80",
    rating: 4.6, ratingCount: 1200, sold: "5K+", stock: 3,
    colors: ["#ffffff","#f8bbd0","#bbdefb"], sizes: ["XS","S","M","L"], tag: "new",
    names: { bn: "কটন কাজু ব্লাউজ - ক্যাজুয়াল উইকেন্ড", en: "Cotton Casual Blouse - Weekend Wear", ar: "بلوزة قطنية كاجوال - ملابس عطلة الأسبوع", hi: "कॉटन कैज़ुअल ब्लाउज़ - वीकेंड वेयर" }
  },
  {
    id: 3, category: "women", price: 849, originalPrice: 1500, discount: 43,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    rating: 4.7, ratingCount: 3100, sold: "15K+", stock: 12,
    colors: ["#1565c0","#212121","#546e7a"], sizes: ["26","28","30","32","34"], tag: "hot",
    names: { bn: "হাই ওয়েস্ট স্কিনি জিন্স - ট্রেন্ডি লুক", en: "High Waist Skinny Jeans - Trendy Look", ar: "جينز ضيق بخصر عالٍ - إطلالة عصرية", hi: "हाई वेस्ट स्किनी जींस - ट्रेंडी लुक" }
  },
  {
    id: 4, category: "women", price: 1199, originalPrice: 2400, discount: 50,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
    rating: 4.9, ratingCount: 890, sold: "3K+", stock: 2,
    colors: ["#e91e8c","#ff9800","#4caf50"], sizes: ["S","M","L","XL"], tag: "sale",
    names: { bn: "এমব্রয়ডারি কুর্তি সেট - উৎসব স্পেশাল", en: "Embroidery Kurti Set - Festival Special", ar: "طقم كورتي مطرز - خاص بالأعياد", hi: "कढ़ाई वाला कुर्ती सेट - त्योहार स्पेशल" }
  },
  {
    id: 5, category: "men", price: 549, originalPrice: 999, discount: 45,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80",
    rating: 4.5, ratingCount: 1800, sold: "8K+", stock: 18,
    colors: ["#ffffff","#1565c0","#37474f","#f44336"], sizes: ["S","M","L","XL","XXL"], tag: "",
    names: { bn: "স্লিম ফিট কটন শার্ট - অফিস কালেকশন", en: "Slim Fit Cotton Shirt - Office Collection", ar: "قميص قطني سليم فيت - كولكشن المكتب", hi: "स्लिम फिट कॉटन शर्ट - ऑफिस कलेक्शन" }
  },
  {
    id: 6, category: "men", price: 799, originalPrice: 1400, discount: 43,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80",
    rating: 4.4, ratingCount: 960, sold: "4K+", stock: 4,
    colors: ["#795548","#212121","#607d8b"], sizes: ["28","30","32","34","36"], tag: "new",
    names: { bn: "কার্গো প্যান্ট - স্ট্রিটওয়্যার এডিশন", en: "Cargo Pants - Streetwear Edition", ar: "بنطلون كارجو - إصدار ستريت وير", hi: "कार्गो पैंट - स्ट्रीटवेयर एडिशन" }
  },
  {
    id: 7, category: "men", price: 699, originalPrice: 1200, discount: 42,
    image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&q=80",
    rating: 4.6, ratingCount: 2200, sold: "12K+", stock: 0,
    colors: ["#ffffff","#212121","#1565c0","#e91e8c"], sizes: ["S","M","L","XL"], tag: "bestseller",
    names: { bn: "পোলো টি-শার্ট প্যাক অব থ্রি - ডেইলি ওয়্যার", en: "Polo T-Shirt Pack of Three - Daily Wear", ar: "حزمة تي شيرت بولو 3 قطع - ملابس يومية", hi: "पोलो टी-शर्ट 3 का पैक - डेली वेयर" }
  },
  {
    id: 8, category: "men", price: 1499, originalPrice: 2800, discount: 46,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80",
    rating: 4.8, ratingCount: 560, sold: "2K+", stock: 22,
    colors: ["#212121","#37474f","#1a237e"], sizes: ["S","M","L","XL","XXL"], tag: "hot",
    names: { bn: "ফর্মাল ব্লেজার - বিজনেস লুক", en: "Formal Blazer - Business Look", ar: "بليزر رسمي - إطلالة الأعمال", hi: "फॉर्मल ब्लेज़र - बिज़नेस लुक" }
  },
  {
    id: 9, category: "kids", price: 249, originalPrice: 499, discount: 50,
    image: "https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=400&q=80",
    rating: 4.7, ratingCount: 1500, sold: "7K+", stock: 5,
    colors: ["#f44336","#2196f3","#4caf50","#ff9800"], sizes: ["2Y","3Y","4Y","5Y","6Y"], tag: "sale",
    names: { bn: "কিউট কার্টুন টি-শার্ট - বাচ্চাদের পছন্দের", en: "Cute Cartoon T-Shirt - Kids Favorite", ar: "تي شيرت كرتوني لطيف - المفضل عند الأطفال", hi: "क्यूट कार्टून टी-शर्ट - बच्चों का पसंदीदा" }
  },
  {
    id: 10, category: "kids", price: 599, originalPrice: 1100, discount: 45,
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&q=80",
    rating: 4.9, ratingCount: 730, sold: "3K+", stock: 11,
    colors: ["#e91e8c","#9c27b0","#f8bbd0"], sizes: ["3Y","4Y","5Y","6Y","7Y"], tag: "new",
    names: { bn: "গার্লস পার্টি ড্রেস - জন্মদিন স্পেশাল", en: "Girls Party Dress - Birthday Special", ar: "فستان سهرة للبنات - خاص بأعياد الميلاد", hi: "गर्ल्स पार्टी ड्रेस - जन्मदिन स्पेशल" }
  },
  {
    id: 11, category: "beauty", price: 349, originalPrice: 700, discount: 50,
    image: "https://images.unsplash.com/photo-1586495777744-4e6232bf2b93?w=400&q=80",
    rating: 4.7, ratingCount: 4200, sold: "20K+", stock: 3,
    colors: ["#e91e8c","#f44336","#e57373","#c2185b"], sizes: ["One Size"], tag: "bestseller",
    names: { bn: "ম্যাট লিপস্টিক কালেকশন - ১২ শেড", en: "Matte Lipstick Collection - 12 Shades", ar: "كولكشن أحمر الشفاه المات - 12 درجة", hi: "मैट लिपस्टिक कलेक्शन - 12 शेड्स" }
  },
  {
    id: 12, category: "beauty", price: 299, originalPrice: 550, discount: 46,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
    rating: 4.8, ratingCount: 3800, sold: "18K+", stock: 27,
    colors: ["#ffffff"], sizes: ["50ml","100ml"], tag: "hot",
    names: { bn: "সানস্ক্রিন SPF 50+ - ত্বকের যত্ন", en: "Sunscreen SPF 50+ - Skin Care", ar: "واقي شمس SPF 50+ - العناية بالبشرة", hi: "सनस्क्रीन SPF 50+ - स्किन केयर" }
  },
  {
    id: 13, category: "shoes", price: 999, originalPrice: 1999, discount: 50,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    rating: 4.6, ratingCount: 2100, sold: "9K+", stock: 1,
    colors: ["#ffffff","#212121","#f44336","#1565c0"], sizes: ["38","39","40","41","42","43","44"], tag: "bestseller",
    video: "Iz7QXkSn9vk",
    colorImages: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=120&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=120&q=80",
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=120&q=80"
    ],
    colorNames: ["White","Black","Red","Blue"],
    names: { bn: "ক্যাজুয়াল স্নিকার - কমফোর্ট কালেকশন", en: "Casual Sneaker - Comfort Collection", ar: "حذاء سنيكر كاجوال - كولكشن مريح", hi: "कैज़ुअल स्नीकर - कम्फर्ट कलेक्शन" }
  },
  {
    id: 14, category: "shoes", price: 799, originalPrice: 1500, discount: 47,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80",
    rating: 4.5, ratingCount: 900, sold: "4K+", stock: 9,
    colors: ["#212121","#795548","#ffd700"], sizes: ["36","37","38","39","40"], tag: "new",
    colorImages: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=120&q=80",
      "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=120&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&q=80"
    ],
    colorNames: ["Black","Brown","Gold"],
    names: { bn: "হিল স্যান্ডেল - পার্টি ওয়্যার", en: "Heel Sandal - Party Wear", ar: "صندل بكعب - ملابس الحفلات", hi: "हील सैंडल - पार्टी वेयर" }
  },
  {
    id: 15, category: "bags", price: 1299, originalPrice: 2500, discount: 48,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
    rating: 4.8, ratingCount: 1600, sold: "6K+", stock: 2,
    colors: ["#795548","#212121","#c2185b"], sizes: ["One Size"], tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&q=80"
    ],
    colorNames: ["Brown","Black","Pink"],
    names: { bn: "লেদার টোট ব্যাগ - ওয়ার্কপ্লেস এসেনশিয়াল", en: "Leather Tote Bag - Workplace Essential", ar: "حقيبة توت جلدية - أساسيات العمل", hi: "लेदर टोट बैग - वर्कप्लेस एसेंशियल" }
  },
  {
    id: 16, category: "bags", price: 599, originalPrice: 1100, discount: 46,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80",
    rating: 4.6, ratingCount: 2700, sold: "11K+", stock: 16,
    colors: ["#e91e8c","#212121","#ffffff","#9c27b0"], sizes: ["One Size"], tag: "sale",
    names: { bn: "মিনি ক্রসবডি ব্যাগ - ট্রেন্ডি স্টাইল", en: "Mini Crossbody Bag - Trendy Style", ar: "حقيبة كروس بودي صغيرة - ستايل عصري", hi: "मिनी क्रॉसबॉडी बैग - ट्रेंडी स्टाइल" }
  },
  {
    id: 17, category: "jewelry", price: 449, originalPrice: 900, discount: 50,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
    rating: 4.7, ratingCount: 3300, sold: "16K+", stock: 4,
    colors: ["#ffd700","#c0c0c0"], sizes: ["One Size"], tag: "bestseller",
    names: { bn: "গোল্ড প্লেটেড নেকলেস সেট - ৩ পিস", en: "Gold Plated Necklace Set - 3 Pieces", ar: "طقم قلادة مطلية بالذهب - 3 قطع", hi: "गोल्ड प्लेटेड नेकलेस सेट - 3 पीस" }
  },
  {
    id: 18, category: "jewelry", price: 199, originalPrice: 400, discount: 50,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80",
    rating: 4.5, ratingCount: 1400, sold: "7K+", stock: 35,
    colors: ["#e91e8c","#9c27b0","#2196f3","#4caf50"], sizes: ["One Size"], tag: "new",
    names: { bn: "স্টোন ব্রেসলেট - বোহেমিয়ান ভাইব", en: "Stone Bracelet - Bohemian Vibe", ar: "سوار حجري - إطلالة بوهيمية", hi: "स्टोन ब्रेसलेट - बोहेमियन वाइब" }
  },
  {
    id: 19, category: "home", price: 1099, originalPrice: 2000, discount: 45,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80",
    rating: 4.8, ratingCount: 900, sold: "4K+", stock: 4,
    colors: ["#ffffff","#f8bbd0","#bbdefb","#c8e6c9"], sizes: ["King","Queen","Single"], tag: "",
    names: { bn: "কটন বেড শিট সেট - কিং সাইজ", en: "Cotton Bed Sheet Set - King Size", ar: "طقم ملاءات قطنية - مقاس كينج", hi: "कॉटन बेड शीट सेट - किंग साइज़" }
  },
  {
    id: 20, category: "home", price: 349, originalPrice: 650, discount: 46,
    image: "https://images.unsplash.com/photo-1602178741583-49b0f2e3f7b6?w=400&q=80",
    rating: 4.6, ratingCount: 1100, sold: "5K+", stock: 0,
    colors: ["#ffffff","#f8bbd0","#fff9c4"], sizes: ["One Size"], tag: "new",
    names: { bn: "অ্যারোমা ক্যান্ডেল সেট - রিল্যাক্সেশন", en: "Aroma Candle Set - Relaxation", ar: "طقم شموع عطرية - للاسترخاء", hi: "अरोमा कैंडल सेट - रिलैक्सेशन" }
  },
  {
    id: 21, category: "electronics", price: 1599, originalPrice: 2999, discount: 47,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
    rating: 4.7, ratingCount: 5600, sold: "25K+", stock: 7,
    colors: ["#ffffff","#212121","#1565c0"], sizes: ["One Size"], tag: "hot",
    video: "6WEOATyMKBA",
    names: { bn: "ওয়্যারলেস ইয়ারবাড - নয়েজ ক্যান্সেলিং", en: "Wireless Earbuds - Noise Cancelling", ar: "سماعات لاسلكية - إلغاء الضوضاء", hi: "वायरलेस ईयरबड्स - नॉइज़ कैंसेलिंग" }
  },
  {
    id: 22, category: "electronics", price: 2499, originalPrice: 4500, discount: 44,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    rating: 4.5, ratingCount: 3400, sold: "14K+", stock: 3,
    colors: ["#212121","#ffffff","#1565c0","#e91e8c"], sizes: ["42mm","46mm"], tag: "bestseller",
    names: { bn: "স্মার্টওয়াচ - ফিটনেস ট্র্যাকার", en: "Smartwatch - Fitness Tracker", ar: "ساعة ذكية - تتبع اللياقة البدنية", hi: "स्मार्टवॉच - फिटनेस ट्रैकर" }
  },
  {
    id: 23, category: "sports", price: 699, originalPrice: 1300, discount: 46,
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80",
    rating: 4.8, ratingCount: 2100, sold: "9K+", stock: 14,
    colors: ["#212121","#1565c0","#e91e8c","#4caf50"], sizes: ["XS","S","M","L","XL"], tag: "hot",
    names: { bn: "ইয়োগা প্যান্ট - হাই ওয়েস্ট ফ্লেক্সি", en: "Yoga Pants - High Waist Flexi", ar: "بنطلون يوجا - خصر عالٍ مرن", hi: "योगा पैंट - हाई वेस्ट फ्लेक्सी" }
  },
  {
    id: 24, category: "sports", price: 299, originalPrice: 550, discount: 46,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80",
    rating: 4.6, ratingCount: 4500, sold: "22K+", stock: 8,
    colors: ["#2196f3","#212121","#4caf50","#f44336"], sizes: ["500ml","1L"], tag: "bestseller",
    names: { bn: "স্পোর্টস ওয়াটার বটল - ১ লিটার BPA ফ্রি", en: "Sports Water Bottle - 1L BPA Free", ar: "زجاجة مياه رياضية - 1 لتر خالية من BPA", hi: "स्पोर्ट्स वाटर बोतल - 1 लीटर BPA फ्री" }
  },

  /* ===== SAUDI FASHION ===== */
  {
    id: 25, category: "women", price: 1499, originalPrice: 2999, discount: 50,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0c?w=400&q=80",
    rating: 4.9, ratingCount: 5200, sold: "24K+", stock: 9,
    colors: ["#212121","#1a237e","#4a0e0e","#2e7d32"], sizes: ["S","M","L","XL","XXL"],
    tag: "bestseller",
    colorImages: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0c?w=120&q=80",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=120&q=80",
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=120&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=120&q=80"
    ],
    colorNames: ["Black","Navy","Maroon","Green"],
    video: "INXM3sRYe18",
    names: { bn: "প্রিমিয়াম আবায়া - মডার্ন ডিজাইন", en: "Premium Abaya - Modern Design", ar: "عباءة بريميوم - تصميم عصري", hi: "प्रीमियम अबाया - मॉडर्न डिज़ाइन" }
  },
  {
    id: 26, category: "women", price: 299, originalPrice: 599, discount: 50,
    image: "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=400&q=80",
    rating: 4.7, ratingCount: 3800, sold: "18K+", stock: 22,
    colors: ["#ffffff","#212121","#e91e8c","#4a0e0e","#2e7d32"], sizes: ["One Size"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=120&q=80",
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=120&q=80",
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0c?w=120&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=120&q=80"
    ],
    colorNames: ["White","Black","Pink","Maroon","Green"],
    names: { bn: "প্রিমিয়াম হিজাব - লাক্সারি শিফন", en: "Premium Hijab - Luxury Chiffon", ar: "حجاب بريميوم - شيفون فاخر", hi: "प्रीमियम हिजाब - लग्ज़री शिफ़ॉन" }
  },
  {
    id: 27, category: "women", price: 1899, originalPrice: 3500, discount: 46,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80",
    rating: 4.8, ratingCount: 2100, sold: "9K+", stock: 5,
    colors: ["#e8d5b7","#c2185b","#1565c0","#2e7d32"], sizes: ["S","M","L","XL"],
    tag: "new",
    colorImages: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=120&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=120&q=80",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=120&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=120&q=80"
    ],
    colorNames: ["Beige","Red","Blue","Green"],
    names: { bn: "এমব্রয়ডারি কাফতান - সৌদি ওয়েডিং স্পেশাল", en: "Embroidery Kaftan - Saudi Wedding Special", ar: "قفطان مطرز - خاص للأعراس السعودية", hi: "कढ़ाई कफ्तान - सऊदी वेडिंग स्पेशल" }
  },
  {
    id: 28, category: "men", price: 1299, originalPrice: 2400, discount: 46,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    rating: 4.9, ratingCount: 6700, sold: "30K+", stock: 12,
    colors: ["#ffffff","#f5f5dc","#e8d5b7","#d3d3d3"], sizes: ["S","M","L","XL","XXL","XXXL"],
    tag: "bestseller",
    colorImages: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80"
    ],
    colorNames: ["White","Cream","Beige","Light Grey"],
    names: { bn: "সৌদি থোব - প্রিমিয়াম কটন", en: "Saudi Thobe - Premium Cotton", ar: "ثوب سعودي - قطن بريميوم", hi: "सऊदी थोब - प्रीमियम कॉटन" }
  },

  /* ===== PERFUME & OUD ===== */
  {
    id: 29, category: "beauty", price: 2499, originalPrice: 4500, discount: 44,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80",
    rating: 4.9, ratingCount: 7800, sold: "35K+", stock: 8,
    colors: ["#ffd700","#c8a96e","#8b4513"], sizes: ["50ml","100ml","200ml"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=120&q=80",
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=120&q=80",
      "https://images.unsplash.com/photo-1571781565036-d3f759b47694?w=120&q=80"
    ],
    colorNames: ["Gold Edition","Classic","Oud Dark"],
    names: { bn: "আরাবিয়ান উদ পারফিউম - লাক্সারি কালেকশন", en: "Arabian Oud Perfume - Luxury Collection", ar: "عطر العود العربي - كولكشن فاخرة", hi: "अरेबियन उड परफ्यूम - लक्ज़री कलेक्शन" }
  },
  {
    id: 30, category: "beauty", price: 899, originalPrice: 1699, discount: 47,
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&q=80",
    rating: 4.7, ratingCount: 4200, sold: "19K+", stock: 15,
    colors: ["#e8d5b7","#c2185b","#9c27b0"], sizes: ["30ml","60ml"],
    tag: "new",
    names: { bn: "রোজ উদ বডি মিস্ট - রিফ্রেশিং", en: "Rose Oud Body Mist - Refreshing", ar: "رذاذ جسم وردة العود - منعش", hi: "रोज़ उड बॉडी मिस्ट - रिफ्रेशिंग" }
  },

  /* ===== ELECTRONICS ===== */
  {
    id: 31, category: "electronics", price: 1999, originalPrice: 3999, discount: 50,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80",
    rating: 4.8, ratingCount: 6200, sold: "28K+", stock: 11,
    colors: ["#212121","#ffffff","#1565c0","#e91e8c"], sizes: ["One Size"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=120&q=80",
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=120&q=80",
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=120&q=80",
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=120&q=80"
    ],
    colorNames: ["Black","White","Blue","Pink"],
    video: "6WEOATyMKBA",
    names: { bn: "পোর্টেবল ব্লুটুথ স্পিকার - 360° সাউন্ড", en: "Portable Bluetooth Speaker - 360° Sound", ar: "مكبر صوت بلوتوث محمول - صوت 360°", hi: "पोर्टेबल ब्लूटूथ स्पीकर - 360° साउंड" }
  },
  {
    id: 32, category: "electronics", price: 1299, originalPrice: 2500, discount: 48,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80",
    rating: 4.7, ratingCount: 4900, sold: "22K+", stock: 7,
    colors: ["#212121","#ffffff","#e91e8c"], sizes: ["20000mAh","10000mAh"],
    tag: "bestseller",
    names: { bn: "পাওয়ার ব্যাংক ২০০০০ mAh - ফাস্ট চার্জিং", en: "Power Bank 20000mAh - Fast Charging", ar: "باور بانك 20000 مللي أمبير - شحن سريع", hi: "पावर बैंक 20000mAh - फास्ट चार्जिंग" }
  },
  {
    id: 33, category: "electronics", price: 799, originalPrice: 1500, discount: 47,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
    rating: 4.6, ratingCount: 3700, sold: "16K+", stock: 19,
    colors: ["#212121","#ffffff","#c0c0c0"], sizes: ["One Size"],
    tag: "new",
    names: { bn: "ওয়্যারলেস চার্জিং প্যাড - ১৫W ফাস্ট চার্জ", en: "Wireless Charging Pad - 15W Fast Charge", ar: "لوحة شحن لاسلكية - شحن سريع 15 واط", hi: "वायरलेस चार्जिंग पैड - 15W फास्ट चार्ज" }
  },
  {
    id: 34, category: "electronics", price: 2999, originalPrice: 5500, discount: 45,
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80",
    rating: 4.8, ratingCount: 8900, sold: "40K+", stock: 6,
    colors: ["#212121","#1565c0","#e91e8c","#4caf50"], sizes: ["One Size"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=120&q=80",
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=120&q=80",
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=120&q=80",
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=120&q=80"
    ],
    colorNames: ["Black","Blue","Pink","Green"],
    names: { bn: "প্রো গেমিং হেডসেট - সারাউন্ড সাউন্ড", en: "Pro Gaming Headset - Surround Sound", ar: "سماعة ألعاب احترافية - صوت محيطي", hi: "प्रो गेमिंग हेडसेट - सराउंड साउंड" }
  },
  {
    id: 35, category: "electronics", price: 4999, originalPrice: 8999, discount: 44,
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80",
    rating: 4.9, ratingCount: 11200, sold: "50K+", stock: 4,
    colors: ["#212121","#c0c0c0","#ffd700"], sizes: ["One Size"],
    tag: "bestseller",
    names: { bn: "স্মার্ট হোম সিকিউরিটি ক্যামেরা - ৪K", en: "Smart Home Security Camera - 4K", ar: "كاميرا أمان منزل ذكي - 4K", hi: "स्मार्ट होम सिक्योरिटी कैमरा - 4K" }
  },

  /* ===== BEAUTY & SKINCARE ===== */
  {
    id: 36, category: "beauty", price: 699, originalPrice: 1300, discount: 46,
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&q=80",
    rating: 4.8, ratingCount: 5600, sold: "26K+", stock: 14,
    colors: ["#ffffff"], sizes: ["One Size"],
    tag: "hot",
    names: { bn: "কোরিয়ান স্কিনকেয়ার সেট - ৫ স্টেপ রুটিন", en: "Korean Skincare Set - 5 Step Routine", ar: "مجموعة العناية بالبشرة الكورية - روتين 5 خطوات", hi: "कोरियन स्किनकेयर सेट - 5 स्टेप रूटीन" }
  },
  {
    id: 37, category: "beauty", price: 449, originalPrice: 850, discount: 47,
    image: "https://images.unsplash.com/photo-1583241475880-083f84372725?w=400&q=80",
    rating: 4.7, ratingCount: 3900, sold: "17K+", stock: 21,
    colors: ["#f48fb1","#ce93d8","#ef9a9a","#80cbc4"], sizes: ["One Size"],
    tag: "new",
    names: { bn: "আই শ্যাডো প্যালেট - ২৪ শেড", en: "Eye Shadow Palette - 24 Shades", ar: "باليت ظلال العيون - 24 درجة", hi: "आई शैडो पैलेट - 24 शेड्स" }
  },
  {
    id: 38, category: "beauty", price: 549, originalPrice: 999, discount: 45,
    image: "https://images.unsplash.com/photo-1571781565036-d3f759b47694?w=400&q=80",
    rating: 4.6, ratingCount: 2800, sold: "12K+", stock: 30,
    colors: ["#e91e8c","#9c27b0","#f44336","#ff9800"], sizes: ["One Size"],
    tag: "sale",
    names: { bn: "নেইল পোলিশ সেট - ১৮ কালার", en: "Nail Polish Set - 18 Colors", ar: "مجموعة طلاء أظافر - 18 لون", hi: "नेल पॉलिश सेट - 18 कलर्स" }
  },

  /* ===== HOME & KITCHEN ===== */
  {
    id: 39, category: "home", price: 1799, originalPrice: 3200, discount: 44,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
    rating: 4.8, ratingCount: 3400, sold: "15K+", stock: 8,
    colors: ["#ffd700","#c0c0c0","#212121"], sizes: ["One Size"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80",
      "https://images.unsplash.com/photo-1514066558159-fc8c737ef259?w=120&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80"
    ],
    colorNames: ["Gold","Silver","Black"],
    names: { bn: "আরাবিক কফি সেট - দাল্লা ও কাপ", en: "Arabic Coffee Set - Dallah & Cups", ar: "طقم القهوة العربية - دلة وفناجين", hi: "अरबी कॉफी सेट - दल्लाह और कप" }
  },
  {
    id: 40, category: "home", price: 1299, originalPrice: 2400, discount: 46,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    rating: 4.7, ratingCount: 4100, sold: "19K+", stock: 13,
    colors: ["#ff9800","#2196f3","#e91e8c","#4caf50"], sizes: ["2m","5m","10m"],
    tag: "new",
    colorImages: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80"
    ],
    colorNames: ["Warm White","Cool Blue","RGB Color","Green"],
    names: { bn: "স্মার্ট LED স্ট্রিপ লাইট - RGB কালার চেঞ্জিং", en: "Smart LED Strip Light - RGB Color Changing", ar: "شريط إضاءة LED ذكي - تغيير ألوان RGB", hi: "स्मार्ट LED स्ट्रिप लाइट - RGB कलर चेंजिंग" }
  },
  {
    id: 41, category: "home", price: 2499, originalPrice: 4500, discount: 44,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
    rating: 4.6, ratingCount: 2200, sold: "9K+", stock: 6,
    colors: ["#ffffff","#212121"], sizes: ["One Size"],
    tag: "hot",
    names: { bn: "রোবোটিক ভ্যাকুয়াম ক্লিনার - অটো মোড", en: "Robotic Vacuum Cleaner - Auto Mode", ar: "مكنسة روبوتية - وضع تلقائي", hi: "रोबोटिक वैक्यूम क्लीनर - ऑटो मोड" }
  },
  {
    id: 42, category: "home", price: 499, originalPrice: 950, discount: 47,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80",
    rating: 4.5, ratingCount: 1800, sold: "8K+", stock: 25,
    colors: ["#ffffff","#f8bbd0","#b3e5fc","#f0f4c3"], sizes: ["One Size"],
    tag: "sale",
    names: { bn: "বাঁশ কিচেন অর্গানাইজার সেট - ৬ পিস", en: "Bamboo Kitchen Organizer Set - 6 Pieces", ar: "طقم منظم مطبخ خيزران - 6 قطع", hi: "बांस किचन ऑर्गेनाइज़र सेट - 6 पीस" }
  },

  /* ===== SPORTS & FITNESS ===== */
  {
    id: 43, category: "sports", price: 399, originalPrice: 750, discount: 47,
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
    rating: 4.8, ratingCount: 5600, sold: "25K+", stock: 32,
    colors: ["#212121","#e91e8c","#1565c0","#4caf50","#ff9800"], sizes: ["Light","Medium","Heavy","X-Heavy"],
    tag: "bestseller",
    colorImages: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&q=80"
    ],
    colorNames: ["Black","Pink","Blue","Green","Orange"],
    video: "Iz7QXkSn9vk",
    names: { bn: "রেজিস্ট্যান্স ব্যান্ড সেট - ৫ লেভেল", en: "Resistance Band Set - 5 Levels", ar: "مجموعة أربطة مقاومة - 5 مستويات", hi: "रेजिस्टेंस बैंड सेट - 5 लेवल" }
  },
  {
    id: 44, category: "sports", price: 799, originalPrice: 1500, discount: 47,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
    rating: 4.7, ratingCount: 3200, sold: "14K+", stock: 17,
    colors: ["#212121","#1565c0","#e91e8c","#ffffff"], sizes: ["S/M","M/L","L/XL"],
    tag: "hot",
    names: { bn: "স্পোর্টস কমপ্রেশন শর্টস - কুইক ড্রাই", en: "Sports Compression Shorts - Quick Dry", ar: "شورت رياضي ضاغط - جفاف سريع", hi: "स्पोर्ट्स कंप्रेशन शॉर्ट्स - क्विक ड्राई" }
  },
  {
    id: 45, category: "sports", price: 1199, originalPrice: 2200, discount: 45,
    image: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&q=80",
    rating: 4.8, ratingCount: 4500, sold: "20K+", stock: 9,
    colors: ["#212121","#e91e8c","#1565c0","#4caf50"], sizes: ["One Size"],
    tag: "new",
    names: { bn: "ফোল্ডেবল ইয়োগা ম্যাট - নন-স্লিপ", en: "Foldable Yoga Mat - Non-Slip", ar: "حصيرة يوجا قابلة للطي - مانعة للانزلاق", hi: "फोल्डेबल योगा मैट - नॉन-स्लिप" }
  },

  /* ===== KIDS ===== */
  {
    id: 46, category: "kids", price: 799, originalPrice: 1500, discount: 47,
    image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&q=80",
    rating: 4.9, ratingCount: 4200, sold: "19K+", stock: 16,
    colors: ["#f44336","#2196f3","#4caf50","#ff9800"], sizes: ["200pcs","500pcs"],
    tag: "bestseller",
    colorImages: [
      "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=120&q=80",
      "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=120&q=80",
      "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=120&q=80",
      "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=120&q=80"
    ],
    colorNames: ["Classic","City Set","Nature","Space"],
    names: { bn: "ক্রিয়েটিভ বিল্ডিং ব্লকস - STEM টয়", en: "Creative Building Blocks - STEM Toy", ar: "مكعبات بناء إبداعية - لعبة STEM", hi: "क्रिएटिव बिल्डिंग ब्लॉक्स - STEM टॉय" }
  },
  {
    id: 47, category: "kids", price: 349, originalPrice: 650, discount: 46,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80",
    rating: 4.7, ratingCount: 2900, sold: "13K+", stock: 20,
    colors: ["#e91e8c","#9c27b0","#f8bbd0"], sizes: ["One Size"],
    tag: "new",
    names: { bn: "সফট প্লাশ টেডি বিয়ার - কিউট গিফট", en: "Soft Plush Teddy Bear - Cute Gift", ar: "دب ضخم ناعم - هدية لطيفة", hi: "सॉफ्ट प्लश टेडी बेयर - क्यूट गिफ्ट" }
  },
  {
    id: 48, category: "kids", price: 549, originalPrice: 1000, discount: 45,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    rating: 4.8, ratingCount: 1900, sold: "8K+", stock: 11,
    colors: ["#f44336","#2196f3","#4caf50","#e91e8c"], sizes: ["One Size"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80"
    ],
    colorNames: ["Red","Blue","Green","Pink"],
    names: { bn: "কিডস স্কুল ব্যাকপ্যাক - ওয়াটারপ্রুফ", en: "Kids School Backpack - Waterproof", ar: "حقيبة ظهر مدرسية للأطفال - مقاومة للماء", hi: "किड्स स्कूल बैकपैक - वाटरप्रूफ" }
  },

  /* ===== SHOES ===== */
  {
    id: 49, category: "shoes", price: 1299, originalPrice: 2500, discount: 48,
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&q=80",
    rating: 4.7, ratingCount: 3600, sold: "16K+", stock: 7,
    colors: ["#212121","#795548","#f5f5dc"], sizes: ["40","41","42","43","44","45"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=120&q=80",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=120&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80"
    ],
    colorNames: ["Black","Brown","Beige"],
    names: { bn: "মেন্স লেদার লোফার - অফিস ক্লাসিক", en: "Men's Leather Loafer - Office Classic", ar: "لوفر جلدي للرجال - كلاسيك المكتب", hi: "मेन्स लेदर लोफर - ऑफिस क्लासिक" }
  },
  {
    id: 50, category: "shoes", price: 899, originalPrice: 1700, discount: 47,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80",
    rating: 4.6, ratingCount: 2500, sold: "11K+", stock: 13,
    colors: ["#ffffff","#212121","#f44336","#ff9800"], sizes: ["28","30","32","34","36"],
    tag: "new",
    colorImages: [
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=120&q=80",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=120&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=120&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80"
    ],
    colorNames: ["White","Black","Red","Orange"],
    names: { bn: "কিডস স্পোর্টস স্নিকার - লাইটওয়েট", en: "Kids Sports Sneaker - Lightweight", ar: "حذاء رياضي للأطفال - خفيف الوزن", hi: "किड्स स्पोर्ट्स स्नीकर - लाइटवेट" }
  },
  {
    id: 51, category: "shoes", price: 1599, originalPrice: 2999, discount: 47,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80",
    rating: 4.8, ratingCount: 3100, sold: "14K+", stock: 5,
    colors: ["#212121","#ffffff","#c2185b","#ffd700"], sizes: ["36","37","38","39","40","41"],
    tag: "bestseller",
    colorImages: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=120&q=80",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=120&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80"
    ],
    colorNames: ["Black","White","Rose","Gold"],
    names: { bn: "লেডিজ ব্লক হিল - ওয়েডিং সিজন", en: "Ladies Block Heel - Wedding Season", ar: "حذاء بكعب مكتل للسيدات - موسم الأعراس", hi: "लेडीज़ ब्लॉक हील - वेडिंग सीज़न" }
  },

  /* ===== BAGS ===== */
  {
    id: 52, category: "bags", price: 2499, originalPrice: 4500, discount: 44,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    rating: 4.8, ratingCount: 2800, sold: "12K+", stock: 6,
    colors: ["#212121","#37474f","#795548"], sizes: ["20 inch","24 inch","28 inch"],
    tag: "hot",
    colorImages: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80"
    ],
    colorNames: ["Black","Dark Grey","Brown"],
    names: { bn: "হার্ডশেল ট্রলি লাগেজ - TSA লক", en: "Hardshell Trolley Luggage - TSA Lock", ar: "حقيبة ترولي صلبة - قفل TSA", hi: "हार्डशेल ट्रॉली लगेज - TSA लॉक" }
  },
  {
    id: 53, category: "bags", price: 1499, originalPrice: 2800, discount: 46,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80",
    rating: 4.7, ratingCount: 3500, sold: "16K+", stock: 10,
    colors: ["#212121","#795548","#37474f"], sizes: ["One Size"],
    tag: "new",
    colorImages: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=120&q=80"
    ],
    colorNames: ["Black","Brown","Grey"],
    names: { bn: "মেন্স ল্যাপটপ ব্যাকপ্যাক - ১৫.৬\" ফিট", en: "Men's Laptop Backpack - 15.6\" Fit", ar: "حقيبة ظهر لابتوب للرجال - مقاس 15.6 بوصة", hi: "मेन्स लैपटॉप बैकपैक - 15.6\" फिट" }
  },

  /* ===== JEWELRY ===== */
  {
    id: 54, category: "jewelry", price: 699, originalPrice: 1400, discount: 50,
    image: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=400&q=80",
    rating: 4.8, ratingCount: 4600, sold: "21K+", stock: 8,
    colors: ["#ffd700","#c0c0c0","#e8d5b7"], sizes: ["One Size"],
    tag: "bestseller",
    colorImages: [
      "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=120&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=120&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=120&q=80"
    ],
    colorNames: ["Gold","Silver","Rose Gold"],
    names: { bn: "পার্ল ড্রপ ইয়াররিং - ক্লাসিক এলিগ্যান্স", en: "Pearl Drop Earring - Classic Elegance", ar: "قرط لؤلؤ دروب - أناقة كلاسيكية", hi: "पर्ल ड्रॉप ईयरिंग - क्लासिक एलिगेंस" }
  },
  {
    id: 55, category: "jewelry", price: 349, originalPrice: 699, discount: 50,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80",
    rating: 4.6, ratingCount: 2900, sold: "13K+", stock: 28,
    colors: ["#ffd700","#c0c0c0","#e8d5b7"], sizes: ["6","7","8","9"],
    tag: "new",
    names: { bn: "অ্যাডজাস্টেবল রিং সেট - ৩ পিস", en: "Adjustable Ring Set - 3 Pieces", ar: "طقم خواتم قابلة للتعديل - 3 قطع", hi: "एडजस्टेबल रिंग सेट - 3 पीस" }
  },

  /* ===== EXTRA TRENDING ===== */
  {
    id: 56, category: "women", price: 749, originalPrice: 1400, discount: 46,
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80",
    rating: 4.7, ratingCount: 3100, sold: "14K+", stock: 6,
    colors: ["#212121","#e91e8c","#ffffff","#ff9800"], sizes: ["S","M","L","XL"],
    tag: "hot",
    names: { bn: "স্পোর্টস সেট - ব্রা + লেগিংস কম্বো", en: "Sports Set - Bra + Leggings Combo", ar: "طقم رياضي - حمالة + ليغينز", hi: "स्पोर्ट्स सेट - ब्रा + लेगिंग्स कॉम्बो" }
  },
  {
    id: 57, category: "men", price: 649, originalPrice: 1200, discount: 46,
    image: "https://images.unsplash.com/photo-1609873814058-a8928924184a?w=400&q=80",
    rating: 4.6, ratingCount: 2400, sold: "11K+", stock: 15,
    colors: ["#212121","#37474f","#1565c0","#795548"], sizes: ["S","M","L","XL","XXL"],
    tag: "new",
    names: { bn: "মেন্স হুডি সোয়েটশার্ট - ফ্লিস ওয়ার্ম", en: "Men's Hoodie Sweatshirt - Fleece Warm", ar: "هودي رجالي - دافئ من الصوف", hi: "मेन्स हूडी स्वेटशर्ट - फ्लीस वार्म" }
  },
  {
    id: 58, category: "electronics", price: 3499, originalPrice: 6500, discount: 46,
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80",
    rating: 4.9, ratingCount: 9800, sold: "45K+", stock: 3,
    colors: ["#212121","#c0c0c0"], sizes: ["10 inch","12 inch"],
    tag: "bestseller",
    names: { bn: "ড্রয়িং ট্যাবলেট - ডিজিটাল আর্ট প্রো", en: "Drawing Tablet - Digital Art Pro", ar: "لوحة رسم رقمي - فن رقمي احترافي", hi: "ड्राइंग टैबलेट - डिजिटल आर्ट प्रो" }
  },
  {
    id: 59, category: "home", price: 999, originalPrice: 1800, discount: 44,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    rating: 4.7, ratingCount: 3700, sold: "17K+", stock: 18,
    colors: ["#212121","#ffffff","#c0c0c0"], sizes: ["One Size"],
    tag: "new",
    names: { bn: "অ্যালার্ম ক্লক স্পিকার - ওয়্যারলেস চার্জার সহ", en: "Alarm Clock Speaker - With Wireless Charger", ar: "ساعة منبه مكبر صوت - مع شاحن لاسلكي", hi: "अलार्म क्लॉक स्पीकर - वायरलेस चार्जर के साथ" }
  },
  {
    id: 60, category: "sports", price: 1599, originalPrice: 2999, discount: 47,
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&q=80",
    rating: 4.8, ratingCount: 5100, sold: "23K+", stock: 9,
    colors: ["#212121","#1565c0","#e91e8c","#4caf50"], sizes: ["One Size"],
    tag: "hot",
    names: { bn: "অ্যাডজাস্টেবল ডাম্বেল সেট - ২০kg", en: "Adjustable Dumbbell Set - 20kg", ar: "مجموعة دمبل قابلة للتعديل - 20 كجم", hi: "एडजस्टेबल डम्बल सेट - 20kg" }
  }
];
