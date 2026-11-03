const YEARS = [[1, '5-6 år'], [2, '7-8 år'], [3, '9-10 år'], [4, '10-11 år']];

const ANIMALS = ['🦊', '🐻', '🐰', '🐼', '🐯', '🦁', '🐸', '🐵', '🦄', '🐱', '🐶', '🐨', '🐧', '🐷'];
const COLORS = ['#ff5a5f', '#ff9f1c', '#ffd23f', '#3bceac', '#0ead69', '#3a86ff', '#8338ec', '#ff70a6', '#6c757d'];

// Money: 5 kr per first-try answer, 2 kr second try, 10 kr + 1 ticket per finished station
const PAY = { first: 5, second: 2, lesson: 10, perRideDaily: 3, coin: 0.5 };

// Stations where the player earns money. topics as in Tasks.make
const CLASSES = {
  billet: {
    name: 'Billetlugen', teacher: 'Bjørnen Bo · plus og minus', icon: '🎟️', tIcon: '🐻', color: '#e63946', item: '🧒',
    topics: { 1: ['add', 'sub'], 2: ['add', 'sub'], 3: ['add', 'sub', 'word'], 4: ['add', 'sub', 'eq', 'word'] },
  },
  isbod: {
    name: 'Isbaren', teacher: 'Pingvinen Pia · tælle og gange', icon: '🍦', tIcon: '🐧', color: '#3a86ff', item: '🍦',
    topics: { 1: ['count'], 2: ['mult'], 3: ['mult', 'div', 'frac'], 4: ['mult', 'div', 'frac', 'eq'] },
  },
  vaerksted: {
    name: 'Værkstedet', teacher: 'Bæveren Bent · figurer og mål', icon: '🔧', tIcon: '🦫', color: '#f77f00', item: '🔩',
    topics: { 1: ['sides', 'grid', 'prob'], 2: ['area', 'perim', 'prob'], 3: ['area', 'perim', 'prob'], 4: ['area', 'perim', 'prob', 'eq'] },
  },
  engelsk: { name: 'Turistinfo', teacher: 'Papegøjen Polly · engelsk', icon: '🗺️', tIcon: '🦜', color: '#0ead69', item: '🧳', kind: 'en' },
  dansk: { name: 'Skiltemaleren', teacher: 'Ræven Rita · dansk', icon: '🪧', tIcon: '🦊', color: '#8338ec', item: '🖌️', kind: 'da' },
};

// [bogstav, ord, emoji]
const DA_LETTERS = [
  ['A', 'abe', '🐒'], ['B', 'bil', '🚗'], ['C', 'citron', '🍋'], ['D', 'drage', '🐉'], ['E', 'elefant', '🐘'],
  ['F', 'fisk', '🐟'], ['G', 'gris', '🐷'], ['H', 'hund', '🐶'], ['I', 'is', '🍦'], ['J', 'juletræ', '🎄'],
  ['K', 'kat', '🐱'], ['L', 'løve', '🦁'], ['M', 'mus', '🐭'], ['N', 'næse', '👃'], ['O', 'ost', '🧀'],
  ['P', 'pære', '🍐'], ['R', 'ræv', '🦊'], ['S', 'sol', '☀️'], ['T', 'tog', '🚂'], ['U', 'ugle', '🦉'],
  ['V', 'vand', '💧'], ['Y', 'yoyo', '🪀'], ['Z', 'zebra', '🦓'], ['Æ', 'æble', '🍎'], ['Ø', 'øre', '👂'],
];

const DA_WORDS = [
  { s: ['bal', 'lon'], e: '🎈' }, { s: ['dra', 'ge'], e: '🐉' }, { s: ['ra', 'ket'], e: '🚀' },
  { s: ['ba', 'nan'], e: '🍌' }, { s: ['gi', 'raf'], e: '🦒' }, { s: ['jord', 'bær'], e: '🍓' },
  { s: ['sne', 'mand'], e: '⛄' }, { s: ['to', 'mat'], e: '🍅' }, { s: ['cy', 'kel'], e: '🚲' },
  { s: ['ping', 'vin'], e: '🐧' }, { s: ['vul', 'kan'], e: '🌋' }, { s: ['pøl', 'se'], e: '🌭' },
  { s: ['ka', 'nin'], e: '🐰' }, { s: ['e', 'le', 'fant'], e: '🐘' }, { s: ['pa', 'ra', 'ply'], e: '☂️' },
  { s: ['gu', 'le', 'rod'], e: '🥕' }, { s: ['a', 'na', 'nas'], e: '🍍' }, { s: ['ap', 'pel', 'sin'], e: '🍊' },
  { s: ['som', 'mer', 'fugl'], e: '🦋' }, { s: ['en', 'hjør', 'ning'], e: '🦄' }, { s: ['ka', 'rus', 'sel'], e: '🎠' },
  { s: ['skild', 'pad', 'de'], e: '🐢' }, { s: ['kæn', 'gu', 'ru'], e: '🦘' }, { s: ['ham', 'bur', 'ger'], e: '🍔' },
  { s: ['blæk', 'sprut', 'te'], e: '🐙' }, { s: ['kro', 'ko', 'dil', 'le'], e: '🐊' }, { s: ['he', 'li', 'kop', 'ter'], e: '🚁' },
  { s: ['pa', 'pe', 'gø', 'je'], e: '🦜' }, { s: ['pan', 'de', 'ka', 'ge'], e: '🥞' }, { s: ['cho', 'ko', 'la', 'de'], e: '🍫' },
];

const DA_SENTENCES = [
  { t: 'Emma kører i rutsjebanen med sin far.', q: 'Hvem kører Emma med?', a: 'Sin far', w: ['Sin mor', 'Sin bror', 'Sin hund'] },
  { t: 'Noah køber en stor is med jordbær.', q: 'Hvad køber Noah?', a: 'En is', w: ['En pølse', 'En ballon', 'En bamse'] },
  { t: 'Der er lang kø ved Lynet i dag.', q: 'Hvor er der kø?', a: 'Ved Lynet', w: ['Ved isbaren', 'Ved søen', 'Ved toilettet'] },
  { t: 'Pariserhjulet er det højeste i hele parken.', q: 'Hvad er højest?', a: 'Pariserhjulet', w: ['Karrusellen', 'Isboden', 'Træet'] },
  { t: 'Ida får en rød ballon af klovnen.', q: 'Hvilken farve har ballonen?', a: 'Rød', w: ['Blå', 'Gul', 'Grøn'] },
  { t: 'Svanebådene sejler langsomt rundt på søen.', q: 'Hvor sejler bådene?', a: 'På søen', w: ['I poolen', 'På vejen', 'I skoven'] },
  { t: 'Om morgenen åbner parken klokken ti.', q: 'Hvornår åbner parken?', a: 'Klokken ti', w: ['Klokken to', 'Klokken seks', 'Om natten'] },
  { t: 'Oskar er lidt bange for Flagermusen.', q: 'Hvordan har Oskar det?', a: 'Lidt bange', w: ['Meget glad', 'Træt', 'Sulten'] },
  { t: 'I Vandlandet bliver alle helt våde.', q: 'Hvordan bliver man i Vandlandet?', a: 'Våd', w: ['Tør', 'Kold', 'Beskidt'] },
  { t: 'Ræven Rita maler et nyt skilt til hulen.', q: 'Hvad maler Rita?', a: 'Et skilt', w: ['Et hus', 'En bil', 'En båd'] },
  { t: 'Bjørnen Bo sælger billetter i lugen.', q: 'Hvad sælger Bo?', a: 'Billetter', w: ['Is', 'Pølser', 'Balloner'] },
  { t: 'Radiobilerne kører ind i hinanden.', q: 'Hvad gør radiobilerne?', a: 'Kører ind i hinanden', w: ['Flyver', 'Sejler', 'Står stille'] },
  { t: 'Karrusellen har hvide heste med guld.', q: 'Hvilken farve har hestene?', a: 'Hvide', w: ['Sorte', 'Brune', 'Røde'] },
  { t: 'Familien spiser madpakker ved springvandet.', q: 'Hvor spiser familien?', a: 'Ved springvandet', w: ['I toget', 'På taget', 'I hulen'] },
  { t: 'Det regner, så alle tager regnfrakke på.', q: 'Hvad tager de på?', a: 'Regnfrakke', w: ['Badetøj', 'Hue', 'Solbriller'] },
  { t: 'Pingvinen Pia sælger is med krymmel.', q: 'Hvad er der på isen?', a: 'Krymmel', w: ['Ketchup', 'Salt', 'Peber'] },
  { t: 'Toget kører ind i Rævens Hule.', q: 'Hvor kører toget ind?', a: 'I Rævens Hule', w: ['I søen', 'I tårnet', 'I butikken'] },
  { t: 'Fra toppen af tårnet kan man se havet.', q: 'Hvad kan man se?', a: 'Havet', w: ['Månen', 'Skolen', 'Skoven'] },
  { t: 'Mia vinder en stor bamse i skydeteltet.', q: 'Hvad vinder Mia?', a: 'En bamse', w: ['En is', 'En bil', 'En kat'] },
  { t: 'Lukas har solbriller og kasket på.', q: 'Hvad har Lukas på hovedet?', a: 'En kasket', w: ['En hjelm', 'En hat', 'En krone'] },
  { t: 'Bæveren Bent reparerer skinnerne om natten.', q: 'Hvornår reparerer Bent?', a: 'Om natten', w: ['Om morgenen', 'Til frokost', 'Aldrig'] },
  { t: 'Der er tre vogne i det lille tog.', q: 'Hvor mange vogne er der?', a: 'Tre', w: ['To', 'Fem', 'Ti'] },
  { t: 'Fønix er malet rød, orange og gul.', q: 'Hvilke farver har Fønix?', a: 'Rød, orange og gul', w: ['Blå og hvid', 'Sort og grå', 'Grøn og lilla'] },
  { t: 'Papegøjen Polly taler med turister fra hele verden.', q: 'Hvem taler Polly med?', a: 'Turister', w: ['Fisk', 'Lærere', 'Biler'] },
  { t: 'Efter turen er Sofie svimmel og glad.', q: 'Hvordan er Sofie?', a: 'Svimmel og glad', w: ['Sur og træt', 'Våd og kold', 'Sulten og vred'] },
];

// Building blocks for generated sentences: [verb, particle], things, plus who/where/when
const DA_GEN = {
  who: ['Emma', 'Noah', 'Ida', 'Oskar', 'Mia', 'Lukas', 'Sofie', 'William', 'Bjørnen Bo', 'Pingvinen Pia', 'Ræven Rita', 'Bæveren Bent', 'Papegøjen Polly', 'Farmor'],
  acts: [
    { v: ['spiser', ''], what: ['en stor is', 'en varm pølse', 'en sukkervat', 'et rødt æble', 'en pose popcorn'] },
    { v: ['køber', ''], what: ['en ballon', 'en billet', 'en sodavand', 'en bamse', 'en kasket'] },
    { v: ['finder', ''], what: ['en mønt', 'en tabt nøgle', 'en lille hund', 'et kort over parken', 'en blå vante'] },
    { v: ['tegner', ''], what: ['en rutsjebane', 'en karrusel', 'en ræv', 'et pariserhjul', 'en flagermus'] },
    { v: ['leder', 'efter'], what: ['sin mor', 'sin taske', 'sin kasket', 'toilettet', 'udgangen'] },
    { v: ['bærer', ''], what: ['en tung taske', 'en stor bamse', 'tre balloner', 'en bakke med is', 'en lille dreng'] },
    { v: ['hører', ''], what: ['folk der skriger', 'glad musik', 'et højt brag', 'en ræv der griner', 'toget komme'] },
    { v: ['vinker', 'til'], what: ['sin far', 'toget', 'pariserhjulet', 'en klovn', 'svanerne'] },
    { v: ['kigger', 'på'], what: ['fyrværkeriet', 'rutsjebanen', 'søen', 'kortet', 'svanerne'] },
    { v: ['venter', 'på'], what: ['sin tur', 'toget', 'sin ven', 'isen', 'regnen holder op'] },
  ],
  where: ['ved indgangen', 'i køen', 'ved søen', 'i Rævens Hule', 'oppe i pariserhjulet', 'ved isbaren', 'i Vandlandet', 'ved springvandet', 'på legepladsen', 'ved karrusellen', 'i toget'],
  when: ['om morgenen', 'om eftermiddagen', 'til frokost', 'efter turen', 'om aftenen', 'før lukketid', 'i weekenden'],
};

const DA_TEXTS = [
  { t: 'Familien kom til parken klokken ti. De kørte først i karrusellen og derefter i radiobilerne. Til sidst spiste de is.', q: 'Hvad lavede de til sidst?', a: 'Spiste is', w: ['Kørte i karrusellen', 'Kørte radiobil', 'Gik hjem'] },
  { t: 'Emma havde fem turbilletter. Hun brugte to i Ormen og en i Flagermusen.', q: 'Hvor mange billetter har hun tilbage?', a: 'To', w: ['Tre', 'Fem', 'En'] },
  { t: 'Oskar var for lille til Lynet. Han skulle være 120 cm, men han var kun 115 cm.', q: 'Hvorfor måtte Oskar ikke køre?', a: 'Han var for lille', w: ['Han var for gammel', 'Det regnede', 'Den var lukket'] },
  { t: 'Det begyndte at regne om eftermiddagen. Mange gæster gik ind i Rævens Hule, hvor der var tørt.', q: 'Hvorfor gik gæsterne ind i hulen?', a: 'Der var tørt', w: ['Der var is', 'Der var varmt', 'Der var musik'] },
  { t: 'Bæveren Bent tjekker alle skinnerne hver morgen, før parken åbner. Så er alle sikre.', q: 'Hvorfor tjekker Bent skinnerne?', a: 'Så alle er sikre', w: ['Fordi han keder sig', 'Fordi de er beskidte', 'For at male dem'] },
  { t: 'Mia ville vinde en bamse. Hun prøvede tre gange i skydeteltet, og fjerde gang ramte hun.', q: 'Hvornår ramte Mia?', a: 'Fjerde gang', w: ['Første gang', 'Anden gang', 'Tredje gang'] },
  { t: 'I Vandlandet er vandet varmt, selvom det er koldt udenfor. Derfor er der altid mange børn.', q: 'Hvordan er vandet?', a: 'Varmt', w: ['Iskoldt', 'Grønt', 'Salt'] },
  { t: 'Lukas tabte sin kasket i Fønix. Bagefter fandt en ansat den under skinnerne.', q: 'Hvor blev kasketten fundet?', a: 'Under skinnerne', w: ['I søen', 'I køen', 'På toget'] },
  { t: 'Papegøjen Polly kan sige hej på ti sprog. Hun hjælper turister med at finde vej.', q: 'Hvad hjælper Polly med?', a: 'At finde vej', w: ['At sælge is', 'At bygge', 'At male skilte'] },
  { t: 'Fra toppen af pariserhjulet kunne Sofie se hele parken og havet bagved. Hun blev slet ikke bange.', q: 'Hvordan havde Sofie det?', a: 'Hun var ikke bange', w: ['Hun var meget bange', 'Hun var syg', 'Hun var vred'] },
  { t: 'Om aftenen var der fyrværkeri over søen. Alle gæsterne stod stille og kiggede op.', q: 'Hvor var fyrværkeriet?', a: 'Over søen', w: ['Over skoven', 'I hulen', 'Ved indgangen'] },
  { t: 'Noah ville have både is og popcorn, men han havde kun penge til det ene. Han valgte is.', q: 'Hvorfor fik han ikke begge dele?', a: 'Han havde ikke penge nok', w: ['Han var mæt', 'Boden var lukket', 'Han kunne ikke lide popcorn'] },
];

const DA_ANTONYMS = [['varm', 'kold'], ['stor', 'lille'], ['glad', 'ked af det'], ['lys', 'mørk'], ['hurtig', 'langsom'], ['ny', 'gammel'],
  ['høj', 'lav'], ['tung', 'let'], ['åben', 'lukket'], ['først', 'sidst'], ['modig', 'bange'], ['tidlig', 'sen'], ['våd', 'tør'],
  ['fuld', 'tom'], ['op', 'ned'], ['inde', 'ude'], ['stærk', 'svag'], ['blid', 'vred'], ['hård', 'blød'], ['rig', 'fattig']];
const DA_SYNONYMS = [['glad', 'fornøjet'], ['bange', 'skræmt'], ['stor', 'kæmpe'], ['smuk', 'flot'], ['klog', 'kvik'], ['sulten', 'hungrig'],
  ['træt', 'søvnig'], ['lille', 'lillebitte'], ['sjov', 'morsom'], ['begynde', 'starte'], ['kigge', 'se'], ['råbe', 'skrige'], ['vred', 'sur'],
  ['hurtig', 'rap'], ['gammel', 'ældgammel'], ['snakke', 'tale'], ['løbe', 'spurte'], ['mærkelig', 'underlig']];
const DA_COMPOUNDS = [['rutsje', 'bane'], ['is', 'bod'], ['tur', 'billet'], ['pølse', 'vogn'], ['vand', 'land'], ['sne', 'mand'], ['regn', 'bue'],
  ['sukker', 'vat'], ['spring', 'vand'], ['lege', 'plads'], ['fald', 'tårn'], ['radio', 'bil'], ['skyde', 'telt'], ['fyr', 'værkeri'], ['sol', 'briller'],
  ['frokost', 'pause'], ['flager', 'mus'], ['indgangs', 'billet'], ['karrusel', 'hest'], ['sommer', 'ferie']];
const DA_WORDCLASS = [['karrusel', 'navneord'], ['ballon', 'navneord'], ['billet', 'navneord'], ['rutsjebane', 'navneord'], ['ræv', 'navneord'], ['is', 'navneord'],
  ['køre', 'udsagnsord'], ['skrige', 'udsagnsord'], ['spise', 'udsagnsord'], ['bygger', 'udsagnsord'], ['løber', 'udsagnsord'], ['griner', 'udsagnsord'],
  ['rød', 'tillægsord'], ['modig', 'tillægsord'], ['høj', 'tillægsord'], ['vild', 'tillægsord'], ['svimmel', 'tillægsord'], ['hurtig', 'tillægsord']];
const DA_RHYMES = [['kat', '🐱', 'hat', '🎩'], ['mus', '🐭', 'hus', '🏠'], ['sol', '☀️', 'stol', '🪑'], ['bil', '🚗', 'pil', '🏹'],
  ['ko', '🐮', 'sko', '👟'], ['is', '🍦', 'ris', '🍚'], ['ost', '🧀', 'post', '📮'], ['bog', '📕', 'tog', '🚂'],
  ['mand', '👨', 'vand', '💧'], ['hest', '🐴', 'fest', '🎉'], ['nød', '🌰', 'brød', '🍞'], ['fisk', '🐟', 'disk', '💿']];

// [engelsk, emoji/farve, dansk]
const EN_ANIMALS = [
  ['cat', '🐱', 'kat'], ['dog', '🐶', 'hund'], ['fox', '🦊', 'ræv'], ['frog', '🐸', 'frø'], ['fish', '🐟', 'fisk'],
  ['bird', '🐦', 'fugl'], ['horse', '🐴', 'hest'], ['mouse', '🐭', 'mus'], ['rabbit', '🐰', 'kanin'], ['bear', '🐻', 'bjørn'],
  ['penguin', '🐧', 'pingvin'], ['lion', '🦁', 'løve'], ['pig', '🐷', 'gris'], ['bat', '🦇', 'flagermus'], ['swan', '🦢', 'svane'],
];
const EN_THINGS = [
  ['ball', '⚽', 'bold'], ['hat', '🎩', 'hat'], ['balloon', '🎈', 'ballon'], ['star', '⭐', 'stjerne'], ['moon', '🌙', 'måne'],
  ['sun', '☀️', 'sol'], ['cake', '🍰', 'kage'], ['apple', '🍎', 'æble'], ['house', '🏠', 'hus'], ['key', '🔑', 'nøgle'],
  ['ice cream', '🍦', 'is'], ['ticket', '🎟️', 'billet'], ['boat', '⛵', 'båd'], ['train', '🚂', 'tog'], ['tree', '🌳', 'træ'],
  ['car', '🚗', 'bil'], ['book', '📕', 'bog'], ['door', '🚪', 'dør'],
];
const EN_COLORS = [
  ['red', '#d62828', 'rød'], ['blue', '#1d4ed8', 'blå'], ['green', '#2a9d3a', 'grøn'], ['yellow', '#f6c90e', 'gul'],
  ['black', '#111111', 'sort'], ['white', '#ffffff', 'hvid'], ['orange', '#f77f00', 'orange'], ['purple', '#7b2cbf', 'lilla'],
  ['pink', '#ff70a6', 'lyserød'], ['brown', '#7f4f24', 'brun'],
];
const EN_NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const DA_NUMBERS = ['en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti'];

const EN_PLURALS = [
  ['cats', '🐱'], ['dogs', '🐶'], ['balloons', '🎈'], ['frogs', '🐸'], ['birds', '🐦'], ['apples', '🍎'],
  ['stars', '⭐'], ['cakes', '🍰'], ['books', '📕'], ['keys', '🔑'], ['tickets', '🎟️'], ['boats', '⛵'],
];

const EN_PHRASES = [
  ['Good morning', 'God morgen'], ['Good night', 'Godnat'], ['Thank you', 'Tak'], ['How are you?', 'Hvordan har du det?'],
  ['I am happy', 'Jeg er glad'], ['I am hungry', 'Jeg er sulten'], ['I like ice cream', 'Jeg kan lide is'],
  ['Where is the toilet?', 'Hvor er toilettet?'], ['One ticket, please', 'En billet, tak'], ['That was fun', 'Det var sjovt'],
  ['See you later', 'Vi ses senere'], ['Let us go again', 'Lad os køre igen'], ['My name is Emma', 'Mit navn er Emma'],
  ['I am not scared', 'Jeg er ikke bange'], ['It is very fast', 'Den er meget hurtig'], ['Let us play', 'Lad os lege'],
];

const EN_SENTENCES = [
  ['The roller coaster is very fast', 'Rutsjebanen er meget hurtig'], ['I want a red balloon', 'Jeg vil have en rød ballon'],
  ['We are eating ice cream', 'Vi spiser is'], ['My dog likes to play', 'Min hund kan lide at lege'],
  ['Can you help me please', 'Kan du hjælpe mig'], ['The wheel is very big', 'Hjulet er meget stort'],
  ['She is riding the carousel', 'Hun kører i karrusellen'], ['It is raining today', 'Det regner i dag'],
  ['Where is the entrance', 'Hvor er indgangen'], ['I like the bumper cars', 'Jeg kan lide radiobilerne'],
  ['The park is open today', 'Parken er åben i dag'], ['He can not find his ticket', 'Han kan ikke finde sin billet'],
  ['They are waiting in line', 'De venter i køen'], ['What time is it', 'Hvad er klokken'],
  ['My favourite colour is green', 'Min yndlingsfarve er grøn'], ['The water is very cold', 'Vandet er meget koldt'],
  ['I am ten years old', 'Jeg er ti år gammel'], ['The fox lives in a cave', 'Ræven bor i en hule'],
  ['Hold on to your hat', 'Hold fast på din hat'], ['The boat looks like a swan', 'Båden ligner en svane'],
];

// [sentence with gap, options, answer]
const EN_GRAMMAR = [
  ['I ___ happy.', ['am', 'is', 'are'], 'am'], ['She ___ a ticket.', ['has', 'have', 'having'], 'has'],
  ['They ___ playing.', ['are', 'is', 'am'], 'are'], ['Emma ___ a red cap.', ['wears', 'wear', 'wearing'], 'wears'],
  ['We ___ to the park yesterday.', ['went', 'go', 'goes'], 'went'], ['There ___ three boats.', ['are', 'is', 'am'], 'are'],
  ['Lynet is ___ than Ormen.', ['faster', 'fast', 'fastest'], 'faster'], ['I ___ like spiders.', ['do not', 'does not', 'is not'], 'do not'],
  ['___ is your name?', ['What', 'Who', 'Where'], 'What'], ['He ___ swim.', ['can', 'cans', 'canning'], 'can'],
  ['Noah ___ hungry.', ['is', 'are', 'am'], 'is'], ['Two ___ are on the lake.', ['swans', 'swan', 'swanes'], 'swans'],
  ['___ you like ice cream?', ['Do', 'Does', 'Is'], 'Do'], ['She ___ eating lunch now.', ['is', 'are', 'be'], 'is'],
  ['Bo ___ tickets every day.', ['sells', 'sell', 'selling'], 'sells'], ['Yesterday I ___ a fox.', ['saw', 'see', 'sees'], 'saw'],
  ['This is the ___ ride in the park.', ['fastest', 'fast', 'faster'], 'fastest'], ['___ is the toilet? Over there.', ['Where', 'What', 'Who'], 'Where'],
];

// [text, question, answer, wrong answers]
const EN_READ = [
  ['Emma has a red balloon. It is very big.', 'What colour is the balloon?', 'Red', ['Blue', 'Green', 'Yellow']],
  ['Noah has three brothers and one sister.', 'How many brothers does Noah have?', 'Three', ['One', 'Two', 'Five']],
  ['Mia loves ice cream. She eats it every day in the summer.', 'What does Mia love?', 'Ice cream', ['Cake', 'Pizza', 'Apples']],
  ['The park opens at ten in the morning.', 'When does the park open?', 'At ten', ['At two', 'At six', 'At night']],
  ['The fox lives in a dark cave near the lake.', 'Where does the fox live?', 'In a cave', ['In a tree', 'In a house', 'In the water']],
  ['Bo the bear sells tickets. He is big and friendly.', 'What does Bo sell?', 'Tickets', ['Ice cream', 'Hats', 'Balloons']],
  ['It is raining, so the children wear raincoats.', 'Why do they wear raincoats?', 'It is raining', ['It is hot', 'It is snowing', 'It is Sunday']],
  ['Lynet is the fastest roller coaster in the park.', 'What is Lynet?', 'A roller coaster', ['A boat', 'A train', 'A shop']],
  ['Polly is a parrot. She can talk in many languages.', 'What can Polly do?', 'Talk in many languages', ['Swim', 'Drive a car', 'Sing opera']],
  ['The park closes at eight in the evening.', 'When does the park close?', 'At eight in the evening', ['At noon', 'At six in the morning', 'Never']],
  ['Oskar is too small for Lynet. He rides Ormen instead.', 'Which ride does Oskar take?', 'Ormen', ['Lynet', 'Fønix', 'Falken']],
  ['From the top of the big wheel you can see the sea.', 'What can you see from the top?', 'The sea', ['The moon', 'A forest', 'A mirror']],
];
