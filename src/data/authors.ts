import { Author } from '../types';

export const AUTHORS: Record<string, Author> = {
  // Classic Literature
  'mary-shelley': {
    id: 'auth-mary-shelley',
    name: 'Mary Wollstonecraft Shelley',
    slug: 'mary-shelley',
    role: 'Author',
    bio: 'English novelist who wrote the foundational gothic science fiction masterpiece Frankenstein; or, The Modern Prometheus (1818).',
    birthDeath: '1797 – 1851',
    website: 'https://en.wikipedia.org/wiki/Mary_Shelley',
    verifiedOpenLicense: true
  },
  'lewis-carroll': {
    id: 'auth-lewis-carroll',
    name: 'Lewis Carroll',
    slug: 'lewis-carroll',
    role: 'Author',
    bio: 'Pen name of Charles Lutwidge Dodgson, author of Alice’s Adventures in Wonderland, mathematician, and logician.',
    birthDeath: '1832 – 1898',
    website: 'https://en.wikipedia.org/wiki/Lewis_Carroll',
    verifiedOpenLicense: true
  },
  'franz-kafka': {
    id: 'auth-franz-kafka',
    name: 'Franz Kafka',
    slug: 'franz-kafka',
    role: 'Author',
    bio: 'Bohemian novelist and short-story writer widely regarded as one of the major figures of 20th-century literature. Author of The Metamorphosis.',
    birthDeath: '1883 – 1924',
    website: 'https://en.wikipedia.org/wiki/Franz_Kafka',
    verifiedOpenLicense: true
  },
  'charlotte-perkins-gilman': {
    id: 'auth-charlotte-perkins-gilman',
    name: 'Charlotte Perkins Gilman',
    slug: 'charlotte-perkins-gilman',
    role: 'Author',
    bio: 'American feminist author and social reformer known for the landmark psychological story The Yellow Wallpaper.',
    birthDeath: '1860 – 1935',
    website: 'https://en.wikipedia.org/wiki/Charlotte_Perkins_Gilman',
    verifiedOpenLicense: true
  },
  'cory-doctorow': {
    id: 'auth-cory-doctorow',
    name: 'Cory Doctorow',
    slug: 'cory-doctorow',
    role: 'Author',
    bio: 'Canadian-British science fiction author, activist, and pioneer of Creative Commons book publishing. Author of Little Brother.',
    birthDeath: 'b. 1971',
    website: 'https://craphound.com',
    verifiedOpenLicense: true
  },
  'edwin-abbott': {
    id: 'auth-edwin-abbott',
    name: 'Edwin A. Abbott',
    slug: 'edwin-abbott',
    role: 'Author',
    bio: 'English schoolmaster, theologian, and author of the classic mathematical satire Flatland: A Romance of Many Dimensions.',
    birthDeath: '1838 – 1926',
    website: 'https://en.wikipedia.org/wiki/Edwin_Abbott_Abbott',
    verifiedOpenLicense: true
  },

  // Comics & Webtoons
  'david-revoy': {
    id: 'auth-david-revoy',
    name: 'David Revoy',
    slug: 'david-revoy',
    role: 'Writer & Illustrator',
    bio: 'French digital artist, open source advocate, and creator of the world-renowned open webcomic Pepper & Carrot, released under CC BY 4.0.',
    birthDeath: 'b. 1981',
    website: 'https://www.peppercarrot.com',
    verifiedOpenLicense: true
  },
  'open-art-collective': {
    id: 'auth-open-art-collective',
    name: 'Open Art Collective & Project Stellar',
    slug: 'open-art-collective',
    role: 'Writer & Illustrator',
    bio: 'An international collaboration of open-culture illustrators producing hard sci-fi graphic narratives under CC BY-SA 4.0.',
    birthDeath: 'est. 2021',
    website: 'https://creativecommons.org',
    verifiedOpenLicense: true
  },
  'winsor-mccay': {
    id: 'auth-winsor-mccay',
    name: 'Winsor McCay',
    slug: 'winsor-mccay',
    role: 'Artist',
    bio: 'Pioneering American cartoonist and animator, celebrated for Little Nemo in Slumberland and Gertie the Dinosaur.',
    birthDeath: '1869 – 1934',
    website: 'https://en.wikipedia.org/wiki/Winsor_McCay',
    verifiedOpenLicense: true
  },
  'nina-chen': {
    id: 'auth-nina-chen',
    name: 'Nina Chen',
    slug: 'nina-chen',
    role: 'Writer & Illustrator',
    bio: 'Independent Taiwanese-American comic creator working in solar-punk, slice-of-life, and environmental restoration narratives.',
    birthDeath: 'b. 1994',
    website: 'https://opencomics.org',
    verifiedOpenLicense: true
  },
  'marcus-vance': {
    id: 'auth-marcus-vance',
    name: 'Marcus Vance',
    slug: 'marcus-vance',
    role: 'Artist',
    bio: 'Graphic artist dedicating surrealist monochrome landscape and quiet sequential art to the public domain under CC0 1.0 Universal.',
    birthDeath: 'b. 1988',
    website: 'https://creativecommons.org/publicdomain/zero/1.0/',
    verifiedOpenLicense: true
  },
  'randall-munroe': {
    id: 'auth-randall-munroe',
    name: 'Randall Munroe',
    slug: 'randall-munroe',
    role: 'Writer & Illustrator',
    bio: 'Former NASA roboticist and creator of xkcd, a webcomic of romance, sarcasm, math, and language, released under CC BY-NC 2.5.',
    birthDeath: 'b. 1984',
    website: 'https://xkcd.com',
    verifiedOpenLicense: true
  },
  'richard-stevens': {
    id: 'auth-richard-stevens',
    name: 'Richard Stevens',
    slug: 'richard-stevens',
    role: 'Writer & Illustrator',
    bio: 'Creator of Diesel Sweeties, the iconic pixel-art webcomic about humans and robots, released under CC BY-NC.',
    birthDeath: 'b. 1975',
    website: 'https://www.dieselsweeties.com',
    verifiedOpenLicense: true
  },

  // Manga Masters & Creators
  'katsushika-hokusai': {
    id: 'auth-hokusai',
    name: 'Katsushika Hokusai',
    nativeName: '葛飾北斎',
    slug: 'katsushika-hokusai',
    role: 'Mangaka',
    bio: 'Legendary Edo-period ukiyo-e painter and printmaker who popularized the term "manga" with his 15-volume sketchbooks (Hokusai Manga). Preserved by the Smithsonian Libraries and National Diet Library under CC0 and Worldwide Public Domain.',
    birthDeath: '1760 – 1849',
    website: 'https://library.si.edu/digital-library/book/hokusai-manga',
    verifiedOpenLicense: true
  },
  'hiroshi-seo': {
    id: 'auth-hiroshi-seo',
    name: 'Hiroshi Seo',
    nativeName: '瀬尾浩史',
    slug: 'hiroshi-seo',
    role: 'Mangaka',
    bio: 'Japanese manga artist and illustrator known for creating "Ubunchu!", a light-hearted high-school sysadmin manga licensed openly under Creative Commons Attribution-NonCommercial.',
    birthDeath: 'b. 1978',
    website: 'https://www.aerialline.com',
    verifiedOpenLicense: true
  },
  'rakuten-kitazawa': {
    id: 'auth-rakuten-kitazawa',
    name: 'Rakuten Kitazawa',
    nativeName: '北澤楽天',
    slug: 'rakuten-kitazawa',
    role: 'Mangaka',
    bio: 'Father of modern Japanese comic art and first professional cartoonist in Japan to use the word "manga" in modern serial form. Famous for Tagosaku and Mokube’s Tokyo Sightseeing (1902). Free worldwide under Public Domain (expired 1955+50).',
    birthDeath: '1876 – 1955',
    website: 'https://en.wikipedia.org/wiki/Rakuten_Kitazawa',
    verifiedOpenLicense: true
  },
  'shuho-sato': {
    id: 'auth-shuho-sato',
    name: 'Shūhō Satō',
    nativeName: '佐藤秀峰',
    slug: 'shuho-sato',
    role: 'Mangaka',
    bio: 'Renowned Japanese manga artist best known for the blockbuster medical drama "Say Hello to Black Jack" (ブラックジャックによろしく). In September 2012, Satō made historic industry news by releasing all 13 volumes royalty-free and copyright-free for worldwide digital publication.',
    birthDeath: 'b. 1973',
    website: 'https://mangaonweb.com',
    verifiedOpenLicense: true
  },
  'katsuichi-kabashima': {
    id: 'auth-katsuichi-kabashima',
    name: 'Katsuichi Kabashima & Nobuko Asahi',
    nativeName: '樺島勝一 · 織田小星',
    slug: 'katsuichi-kabashima',
    role: 'Mangaka',
    bio: 'Pioneering creator duo of Shōchan no Bōken (1923), the landmark Japanese newspaper comic that popularized speech bubbles and sparked Japan’s earliest national character craze. Worldwide Public Domain.',
    birthDeath: '1888 – 1965',
    website: 'https://en.wikipedia.org/wiki/Sh%C5%8Dchan_no_B%C5%8Dken',
    verifiedOpenLicense: true
  },
  'traditional-japanese': {
    id: 'auth-traditional-japanese',
    name: 'Court Anonymous (Heian Period)',
    nativeName: '平安朝絵巻伝統',
    slug: 'traditional-japanese',
    role: 'Writer & Illustrator',
    bio: 'Historical artisans of ancient Japanese picture scrolls (emakimono), predecessors of sequential comic narratives.',
    birthDeath: '10th–12th Century',
    website: 'https://www.ndl.go.jp/en/',
    verifiedOpenLicense: true
  },
  'osamu-tezuka': {
    id: 'auth-osamu-tezuka',
    name: 'Osamu Tezuka',
    nativeName: '手塚治虫',
    slug: 'osamu-tezuka',
    role: 'Mangaka',
    bio: 'The God of Manga. Out-of-print titles and authorized promotional chapters are legally accessible via Manga Library Z with estate permission (Link-out only).',
    birthDeath: '1928 – 1989',
    website: 'https://tezukaosamu.net',
    verifiedOpenLicense: true
  },
  'shueisha-editorial': {
    id: 'auth-shueisha-editorial',
    name: 'Shueisha Editorial Team',
    nativeName: '集英社編集部',
    slug: 'shueisha-editorial',
    role: 'Editor',
    bio: 'Promotional portal creators of MANGA MILLION and Shonen Jump+ free preview campaigns. (Link-out only).',
    birthDeath: 'est. 1925',
    website: 'https://shonenjumpplus.com',
    verifiedOpenLicense: true
  },
  'akita-shoten': {
    id: 'auth-akita-shoten',
    name: 'Comic Meteor / Akita Shoten',
    nativeName: '秋田書店',
    slug: 'akita-shoten',
    role: 'Editor',
    bio: 'Official Japanese web manga publishing portal offering authorized free webtoon episodes (Link-out only).',
    birthDeath: 'est. 1948',
    website: 'https://comic-meteor.jp',
    verifiedOpenLicense: true
  },
  'george-orwell': {
    id: 'auth-george-orwell',
    name: 'George Orwell',
    slug: 'george-orwell',
    role: 'Author',
    bio: 'English novelist, essayist, and critic famous for Nineteen Eighty-Four and Animal Farm.',
    birthDeath: '1903 – 1950',
    website: 'https://en.wikipedia.org/wiki/George_Orwell',
    verifiedOpenLicense: true
  },
  'f-scott-fitzgerald': {
    id: 'auth-f-scott-fitzgerald',
    name: 'F. Scott Fitzgerald',
    slug: 'f-scott-fitzgerald',
    role: 'Author',
    bio: 'American novelist of the Jazz Age, celebrated for The Great Gatsby.',
    birthDeath: '1896 – 1940',
    website: 'https://en.wikipedia.org/wiki/F._Scott_Fitzgerald',
    verifiedOpenLicense: true
  },
  'frank-miller': {
    id: 'auth-frank-miller',
    name: 'Frank Miller',
    slug: 'frank-miller',
    role: 'Writer & Illustrator',
    bio: 'Legendary comic creator famous for Batman: Year One and The Dark Knight Returns.',
    birthDeath: 'b. 1957',
    website: 'https://en.wikipedia.org/wiki/Frank_Miller',
    verifiedOpenLicense: true
  },
  'jane-austen': {
    id: 'auth-jane-austen',
    name: 'Jane Austen',
    slug: 'jane-austen',
    role: 'Author',
    bio: 'English novelist known primarily for her six major novels, including Pride and Prejudice.',
    birthDeath: '1775 – 1817',
    website: 'https://en.wikipedia.org/wiki/Jane_Austen',
    verifiedOpenLicense: true
  },
  'hajime-isayama': {
    id: 'auth-hajime-isayama',
    name: 'Hajime Isayama',
    nativeName: '諫山創',
    slug: 'hajime-isayama',
    role: 'Mangaka',
    bio: 'Japanese manga artist and creator of Attack on Titan.',
    birthDeath: 'b. 1986',
    website: 'https://en.wikipedia.org/wiki/Hajime_Isayama',
    verifiedOpenLicense: true
  },
  'jrr-tolkien': {
    id: 'auth-jrr-tolkien',
    name: 'J.R.R. Tolkien',
    slug: 'jrr-tolkien',
    role: 'Author',
    bio: 'English writer and philologist, author of The Hobbit and The Lord of the Rings.',
    birthDeath: '1892 – 1973',
    website: 'https://en.wikipedia.org/wiki/J._R._R._Tolkien',
    verifiedOpenLicense: true
  },
  'neil-gaiman': {
    id: 'auth-neil-gaiman',
    name: 'Neil Gaiman',
    slug: 'neil-gaiman',
    role: 'Author',
    bio: 'English author of short fiction, novels, comic books, graphic novels including The Sandman.',
    birthDeath: 'b. 1960',
    website: 'https://neilgaiman.com',
    verifiedOpenLicense: true
  },
  'herman-melville': {
    id: 'auth-herman-melville',
    name: 'Herman Melville',
    slug: 'herman-melville',
    role: 'Author',
    bio: 'American novelist and poet of the American Renaissance period, author of Moby-Dick.',
    birthDeath: '1819 – 1891',
    website: 'https://en.wikipedia.org/wiki/Herman_Melville',
    verifiedOpenLicense: true
  },
  'bram-stoker': {
    id: 'auth-bram-stoker',
    name: 'Bram Stoker',
    slug: 'bram-stoker',
    role: 'Author',
    bio: 'Irish author celebrated for his 1897 gothic horror masterpiece Dracula.',
    birthDeath: '1847 – 1912',
    website: 'https://en.wikipedia.org/wiki/Bram_Stoker',
    verifiedOpenLicense: true
  },
  'arthur-conan-doyle': {
    id: 'auth-arthur-conan-doyle',
    name: 'Arthur Conan Doyle',
    slug: 'arthur-conan-doyle',
    role: 'Author',
    bio: 'British writer and physician who created the legendary detective Sherlock Holmes.',
    birthDeath: '1859 – 1930',
    website: 'https://en.wikipedia.org/wiki/Arthur_Conan_Doyle',
    verifiedOpenLicense: true
  },
  'hg-wells': {
    id: 'auth-hg-wells',
    name: 'H.G. Wells',
    slug: 'hg-wells',
    role: 'Author',
    bio: 'English writer prolific in many genres, widely acknowledged as the "father of science fiction". Author of The Time Machine and The War of the Worlds.',
    birthDeath: '1866 – 1946',
    website: 'https://en.wikipedia.org/wiki/H._G._Wells',
    verifiedOpenLicense: true
  },
  'jules-verne': {
    id: 'auth-jules-verne',
    name: 'Jules Verne',
    slug: 'jules-verne',
    role: 'Author',
    bio: 'French novelist and pioneer of the science fiction genre. Author of Twenty Thousand Leagues Under the Sea and Around the World in Eighty Days.',
    birthDeath: '1828 – 1905',
    website: 'https://en.wikipedia.org/wiki/Jules_Verne',
    verifiedOpenLicense: true
  },
  'oscar-wilde': {
    id: 'auth-oscar-wilde',
    name: 'Oscar Wilde',
    slug: 'oscar-wilde',
    role: 'Author',
    bio: 'Irish poet and playwright known for his biting wit, flamboyant style, and the gothic philosophical novel The Picture of Dorian Gray.',
    birthDeath: '1854 – 1900',
    website: 'https://en.wikipedia.org/wiki/Oscar_Wilde',
    verifiedOpenLicense: true
  },
  'robert-louis-stevenson': {
    id: 'auth-robert-louis-stevenson',
    name: 'Robert Louis Stevenson',
    slug: 'robert-louis-stevenson',
    role: 'Author',
    bio: 'Scottish novelist, essayist, and poet, celebrated for Strange Case of Dr Jekyll and Mr Hyde and Treasure Island.',
    birthDeath: '1850 – 1894',
    website: 'https://en.wikipedia.org/wiki/Robert_Louis_Stevenson',
    verifiedOpenLicense: true
  },
  'edgar-rice-burroughs': {
    id: 'auth-edgar-rice-burroughs',
    name: 'Edgar Rice Burroughs',
    slug: 'edgar-rice-burroughs',
    role: 'Author',
    bio: 'American speculative fiction writer best known for creating John Carter of Mars (A Princess of Mars) and Tarzan of the Apes.',
    birthDeath: '1875 – 1950',
    website: 'https://en.wikipedia.org/wiki/Edgar_Rice_Burroughs',
    verifiedOpenLicense: true
  }
};
