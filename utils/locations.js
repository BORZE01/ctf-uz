const LOCATIONS = {
    "Qoraqalpog'iston Respublikasi": {
        cities: ["Beruniy", "Bo'ston", "Qo'ng'irot", "Mang'it", "Mo'ynoq", "Nukus", "Taxiatosh", "To'rtko'l", "Xalqobod", "Xo'jayli", "Chimboy", "Shumanay"],
        districts: ["Amudaryo", "Beruniy", "Bo'zatov", "Qorao'zak", "Kegeyli", "Qo'ng'irot", "Qanliko'l", "Mo'ynoq", "Nukus", "Taxiatosh", "Taxtako'pir", "To'rtko'l", "Xo'jayli", "Chimboy", "Shumanay", "Ellikqal'a"]
    },
    "Andijon viloyati": {
        cities: ["Andijon", "Asaka", "Jalaquduq", "Qorasuv", "Qo'rg'ontepa", "Marhamat", "Poytug'", "Paxtaobod", "Xonobod", "Xo'jaobod", "Shahrixon"],
        districts: ["Oltinko'l", "Andijon", "Baliqchi", "Bo'ston", "Buloqboshi", "Jalaquduq", "Izboskan", "Ulug'nor", "Qo'rg'ontepa", "Asaka", "Marhamat", "Shahrixon", "Paxtaobod", "Xo'jaobod"]
    },
    "Buxoro viloyati": {
        cities: ["Olot", "Buxoro", "Vobkent", "Gazli", "Galaosiyo", "G'ijduvon", "Kogon", "Qorako'l", "Qorovulbozor", "Romitan", "Shofirkon"],
        districts: ["Olot", "Buxoro", "Vobkent", "G'ijduvon", "Kogon", "Qorako'l", "Qorovulbozor", "Peshku", "Romitan", "Jondor", "Shofirkon"]
    },
    "Jizzax viloyati": {
        cities: ["Gagarin", "G'allaorol", "Dashtobod", "Jizzax", "Do'stlik", "Paxtakor"],
        districts: ["Arnasoy", "Baxmal", "G'allaorol", "Sharof Rashidov", "Do'stlik", "Zomin", "Zarbdor", "Mirzacho'l", "Zafarobod", "Paxtakor", "Forish", "Yangiobod"]
    },
    "Qashqadaryo viloyati": {
        cities: ["Beshkent", "G'uzor", "Qamashi", "Qarshi", "Koson", "Kitob", "Muborak", "Talimarjon", "Chiroqchi", "Shahrisabz", "Yakkabog'", "Yangi Nishon"],
        districts: ["G'uzor", "Dehqonobod", "Qamashi", "Qarshi", "Koson", "Kasbi", "Kitob", "Mirishkor", "Muborak", "Nishon", "Chiroqchi", "Shahrisabz", "Yakkabog'", "Ko'kdala"]
    },
    "Navoiy viloyati": {
        cities: ["G'ozg'on", "Zarafshon", "Qiziltepa", "Navoiy", "Nurota", "Uchquduq", "Yangirabod"],
        districts: ["Konimex", "Qiziltepa", "Navbahor", "Karmana", "Nurota", "Tomdi", "Uchquduq", "Xatirchi"]
    },
    "Namangan viloyati": {
        cities: ["Kosonsoy", "Namangan", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Xaqqulobod", "Chortoq", "Chust"],
        districts: ["Mingbuloq", "Kosonsoy", "Namangan", "Norin", "Pop", "To'raqo'rg'on", "Uychi", "Uchqo'rg'on", "Chortoq", "Chust", "Yangiqo'rg'on", "Davlatobod", "Yangi Namangan"]
    },
    "Samarqand viloyati": {
        cities: ["Oqtosh", "Bulung'ur", "Jomboy", "Juma", "Ishtixon", "Kattaqo'rg'on", "Nurobod", "Payariq", "Samarqand", "Urgut", "Chelak"],
        districts: ["Oqdaryo", "Bulung'ur", "Jomboy", "Ishtixon", "Kattaqo'rg'on", "Qo'shrabot", "Narpay", "Payariq", "Pastdarg'om", "Paxtachi", "Samarqand", "Nurobod", "Urgut", "Toyloq"]
    },
    "Surxondaryo viloyati": {
        cities: ["Boysun", "Denov", "Jarqo'rg'on", "Qumqo'rg'on", "Termiz", "Sharg'un", "Sherobod", "Sho'rchi"],
        districts: ["Angor", "Bandixon", "Boysun", "Denov", "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Qiziriq", "Qumqo'rg'on", "Sariosiyo", "Termiz", "Uzun", "Sherobod", "Sho'rchi"]
    },
    "Sirdaryo viloyati": {
        cities: ["Baxt", "Guliston", "Sirdaryo", "Shirin", "Yangiyer"],
        districts: ["Oqoltin", "Boyovut", "Sayxunobod", "Guliston", "Sardoba", "Mirzaobod", "Sirdaryo", "Xovos"]
    },
    "Toshkent viloyati": {
        cities: ["Oqqo'rg'on", "Olmaliq", "Angren", "Ohangaron", "Bekobod", "Bo'ka", "G'azalkent", "Do'stobod", "Keles", "Nurafshon", "Parkent", "Piskent", "Chinoz", "Chirchiq", "Yangiobod", "Yangiyo'l"],
        districts: ["Oqqo'rg'on", "Ohangaron", "Bekobod", "Bo'ka", "Bo'stonliq", "Chinoz", "Qibray", "Quyi Chirchiq", "O'rta Chirchiq", "Parkent", "Piskent", "Toshkent", "Yangiyo'l", "Yuqori Chirchiq", "Zangiota"]
    },
    "Farg'ona viloyati": {
        cities: ["Beshariq", "Farg'ona", "Marg'ilon", "Qo'qon", "Quva", "Quvasoy", "Rishton", "Tinchlik", "Yaypan"],
        districts: ["Beshariq", "Bag'dod", "Buvayda", "Dang'ara", "Yozyovon", "Quva", "Oltiariq", "Qo'shtepa", "Rishton", "So'x", "Toshloq", "O'zbekiston", "Uchko'prik", "Farg'ona", "Furqat"]
    },
    "Xorazm viloyati": {
        cities: ["Pitnak", "Urganch", "Xiva"],
        districts: ["Bog'ot", "Gurlan", "Qo'shko'pir", "Urganch", "Xazorasp", "Tuproqqal'a", "Xonqa", "Xiva", "Shovot", "Yangiariq", "Yangibozor"]
    },
    "Toshkent shahri": {
        cities: ["Toshkent"],
        districts: ["Uchtepa", "Bektemir", "Yunusobod", "Mirzo Ulug'bek", "Mirobod", "Shayxontohur", "Olmazor", "Sirg'ali", "Yakkasaroy", "Yashnobod", "Chilonzor", "Yangihayot"]
    }
};

module.exports = LOCATIONS;