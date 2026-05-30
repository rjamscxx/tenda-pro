// ─────────────────────────────────────────────────────────────────────────────
// seed-themes.mjs — themed datasets for the smoke-data simulator.
//
// Each theme is a fully self-contained business: owner persona, venue, menu,
// recipe yields, employee roster, expense pattern, waste samples, and a prior
// payroll run. The runner (scratch-simulate-day.mjs) is theme-agnostic and
// dispatches into here via the registry exported below.
//
// Add a new theme by:
//   1. Creating an object with the same shape as `cafe` below
//   2. Registering it under a unique slug in `themes` at the bottom
//
// All money values are CENTS (₱100 = 10000) — matches schema.
// Prices/costs tuned so monthly margins land in the 28–38% band that small
// PH F&B operators actually see, so the dashboard isn't unrealistically rosy.
// ─────────────────────────────────────────────────────────────────────────────

// ── Sales-pattern primitives ─────────────────────────────────────────────────
// `slots` describes when tickets happen and how many; the runner walks 8 days
// (7 historical + today) scaling per `dayScales`. `dishGroups` keys point to
// arrays of dish keys. Each slot's `items` is a list of [groupKey, probability]:
// probability ≥ 1.0 → always include one from the group; otherwise sample once.

// ── Café Lina — Manila specialty café (the existing baseline) ────────────────
const cafe = {
  slug:        'cafe',
  emailSuffix: 'lina',
  ownerName:   'Lina Hartono',
  venueName:   'Café Lina (SMOKE)',
  menuTheme:   'sage-dark',
  monthlyRevGoal:   50_000_00,
  monthlyExpBudget: 35_000_00,
  dailyRevTarget:    1_500_00,
  foodCostTarget:   32,
  vatRegistered:    false,

  ingredients: [
    { key:'coffee',          name:'Coffee Beans',        unit:'g',   cost:70,   stock:2500,  low:500  },
    { key:'milk',            name:'Fresh Milk',          unit:'mL',  cost:12,   stock:10000, low:1500 },
    { key:'bread',           name:'Bread (slice)',       unit:'pcs', cost:800,  stock:35,    low:10   },
    { key:'eggs',            name:'Eggs',                unit:'pcs', cost:900,  stock:22,    low:8    },
    { key:'pancake',         name:'Pancake Mix',         unit:'g',   cost:18,   stock:1500,  low:400  },
    { key:'sugar',           name:'Sugar',               unit:'g',   cost:8,    stock:600,   low:300  },
    { key:'butter',          name:'Butter',              unit:'g',   cost:60,   stock:600,   low:150  },
    { key:'tuna',            name:'Tuna (can)',          unit:'pcs', cost:8500, stock:8,     low:3    },
    { key:'cheese',          name:'Cheese',              unit:'g',   cost:50,   stock:600,   low:120  },
    { key:'tea',             name:'Tea Bags',            unit:'pcs', cost:1500, stock:30,    low:15   },
    { key:'tomato',          name:'Tomatoes',            unit:'g',   cost:12,   stock:800,   low:250  },
    { key:'lettuce',         name:'Lettuce',             unit:'g',   cost:15,   stock:500,   low:150  },
    { key:'croissant_stock', name:'Croissant Stock',     unit:'pcs', cost:4000, stock:20,    low:8    },
    { key:'roll_stock',      name:'Cinnamon Roll Stock', unit:'pcs', cost:5000, stock:18,    low:6    },
  ],

  dishes: {
    americano:   { name:'Americano',         desc:'Double shot espresso with hot water',           cat:'Drinks',     price:12000, recipe:[['coffee',18]] },
    cappuccino:  { name:'Cappuccino',        desc:'Espresso, steamed milk, foam crown',            cat:'Drinks',     price:15000, recipe:[['coffee',18],['milk',150]] },
    latte:       { name:'Café Latte',        desc:'Espresso layered with silky steamed milk',      cat:'Drinks',     price:16000, recipe:[['coffee',18],['milk',200]] },
    milktea:     { name:'House Milk Tea',    desc:'Loose-leaf black tea with sugar & milk',         cat:'Drinks',     price:13000, recipe:[['tea',1],['milk',200],['sugar',15]] },
    espresso:    { name:'Espresso',          desc:'Single shot of our house blend',                 cat:'Drinks',     price: 9000, recipe:[['coffee',12]] },
    matcha:      { name:'Matcha Latte',      desc:'Ceremonial-grade matcha with steamed milk',      cat:'Drinks',     price:17000, recipe:[['milk',200],['sugar',10]] },
    pancakes:    { name:'Pancake Stack',     desc:'Three buttermilk pancakes with maple butter',    cat:'Breakfast',  price:22000, recipe:[['pancake',120],['eggs',1],['butter',30],['sugar',20]] },
    eggstoast:   { name:'Eggs & Toast',      desc:'Two eggs your way, buttered sourdough',          cat:'Breakfast',  price:18000, recipe:[['eggs',2],['bread',2],['butter',20]] },
    tuna:        { name:'Tuna Sandwich',     desc:'Tuna salad, cheese, fresh lettuce & tomato',     cat:'Sandwiches', price:18000, recipe:[['tuna',0.25],['bread',2],['cheese',20],['lettuce',30],['tomato',20]] },
    cheesetoast: { name:'Grilled Cheese',    desc:'Triple cheese melt on buttered sourdough',       cat:'Sandwiches', price:16000, recipe:[['bread',2],['cheese',60],['butter',15]] },
    croissant:   { name:'Butter Croissant',  desc:'Flaky, golden, baked in-house every morning',    cat:'Pastry',     price: 9500, recipe:[['croissant_stock',1]] },
    cinnaroll:   { name:'Cinnamon Roll',     desc:'Warm sweet roll with cream-cheese glaze',         cat:'Pastry',     price:11000, recipe:[['roll_stock',1]] },
  },

  dishGroups: {
    drinks:    ['americano','cappuccino','latte','milktea','espresso','matcha'],
    breakfast: ['pancakes','eggstoast'],
    sandwich:  ['tuna','cheesetoast'],
    pastry:    ['croissant','cinnaroll'],
  },

  dayScales: [1.05, 0.90, 1.15, 0.85, 1.10, 1.20, 0.95, 1.00],
  slots: [
    { name:'breakfast',  count:22, hour: 7, window:3, items:[['drinks',1.0],['breakfast',0.55],['pastry',0.2]] },
    { name:'midmorning', count:10, hour:10, window:2, items:[['drinks',1.0],['pastry',0.45]] },
    { name:'lunch',      count:30, hour:12, window:2, items:[['sandwich',1.0],['drinks',1.0],['pastry',0.25]] },
    { name:'afternoon',  count:18, hour:14, window:3, items:[['drinks',1.0],['pastry',0.5]] },
    { name:'evening',    count:12, hour:17, window:2, items:[['drinks',1.0],['sandwich',0.3]] },
  ],

  channelMix: { dine_in:0.72, takeout:0.16, delivery:0.12 },

  employees: [
    { key:'lola', fullName:'Lola Maria Reyes', role:'Cashier', payType:'daily',  payRate: 50000 },
    { key:'juan', fullName:'Juan Dela Cruz',   role:'Barista', payType:'daily',  payRate: 70000 },
    { key:'joey', fullName:'Joey Ramos',       role:'Server',  payType:'hourly', payRate:  8000 },
  ],

  // Prior-week payroll run (-13 → -7) so paid badges + overlap warnings have data.
  payrollPreset: [
    { empKey:'lola', days:'6.00', gross:300000, deductions:18000 },
    { empKey:'juan', days:'6.00', gross:420000, deductions:25200 },
    { empKey:'joey', days:'3.00', gross:192000, deductions: 9600 },
  ],

  expensePattern: {
    rentMonthly:      2_500_000,
    dailyIngredient:  280_000,
    monthlyUtilities:  18_000,
    other:    { vendor:'SM Supermarket', amount:40_000, note:'Cleaning supplies' },
    historical: [
      { dayBack:1, category:'ingredients', amount:260_000, vendor:'Mercado Suppliers' },
      { dayBack:3, category:'ingredients', amount:280_000, vendor:'Mercado Suppliers' },
      { dayBack:5, category:'ingredients', amount:300_000, vendor:'Mercado Suppliers' },
      { dayBack:5, category:'utilities',   amount: 15_000, vendor:'Meralco' },
      { dayBack:7, category:'ingredients', amount:240_000, vendor:'Mercado Suppliers' },
    ],
  },

  waste: [
    { ingKey:'croissant_stock', qty:'2',   unit:'pcs', reason:'overcooked', cost:8000, note:'Burned in oven',   dayBack:0 },
    { ingKey:'roll_stock',      qty:'1',   unit:'pcs', reason:'dropped',    cost:5000, note:'Slipped off tray', dayBack:0 },
    { ingKey:'milk',            qty:'200', unit:'mL',  reason:'spoilage',   cost:2400, note:'Expired carton',   dayBack:2 },
  ],
}

// ── Mama Rosa's — neighborhood pizzeria ──────────────────────────────────────
const pizzeria = {
  slug:        'pizzeria',
  emailSuffix: 'rosa',
  ownerName:   'Rosa Bautista',
  venueName:   "Mama Rosa's Pizzeria (SMOKE)",
  menuTheme:   'trattoria',
  monthlyRevGoal:   85_000_00,
  monthlyExpBudget: 60_000_00,
  dailyRevTarget:    2_800_00,
  foodCostTarget:   34,
  vatRegistered:    true,

  ingredients: [
    { key:'flour',     name:'00 Pizza Flour',     unit:'g',   cost:4,    stock:18000, low:4000 },
    { key:'mozza',     name:'Mozzarella',         unit:'g',   cost:90,   stock:2400,  low:600  },
    { key:'tomsauce',  name:'San Marzano Sauce',  unit:'mL',  cost:18,   stock:5000,  low:1200 },
    { key:'basil',     name:'Fresh Basil',        unit:'g',   cost:80,   stock:300,   low:100  },
    { key:'olive',     name:'Olive Oil',          unit:'mL',  cost:35,   stock:2000,  low:500  },
    { key:'pepperoni', name:'Pepperoni Slices',   unit:'g',   cost:160,  stock:1200,  low:300  },
    { key:'mushroom',  name:'Cremini Mushrooms',  unit:'g',   cost:28,   stock:800,   low:200  },
    { key:'spaghetti', name:'Spaghetti (dry)',    unit:'g',   cost:14,   stock:6000,  low:1500 },
    { key:'bacon',     name:'Bacon (guanciale)',  unit:'g',   cost:120,  stock:900,   low:250  },
    { key:'egg_yolks', name:'Egg Yolks',          unit:'pcs', cost:1200, stock:24,    low:8    },
    { key:'parm',      name:'Parmigiano',         unit:'g',   cost:150,  stock:700,   low:200  },
    { key:'pesto',     name:'Pesto (house)',      unit:'mL',  cost:60,   stock:1500,  low:400  },
    { key:'prosciutto',name:'Prosciutto',         unit:'g',   cost:220,  stock:400,   low:120  },
    { key:'arugula',   name:'Arugula',            unit:'g',   cost:50,   stock:600,   low:200  },
    { key:'soda',      name:'Italian Soda (btl)', unit:'pcs', cost:3500, stock:60,    low:20   },
    { key:'red_wine',  name:'House Red (glass)',  unit:'mL',  cost:40,   stock:4000,  low:1000 },
    { key:'tiramisu_stock', name:'Tiramisu Slice',unit:'pcs', cost:9500, stock:18,    low:6    },
  ],
  dishes: {
    margherita:   { name:'Pizza Margherita',  desc:'San Marzano, fior di latte, basil',           cat:'Pizza',  price:38000, recipe:[['flour',280],['tomsauce',120],['mozza',180],['basil',6],['olive',15]] },
    pepperoni:    { name:'Pepperoni',         desc:'Classic Calabrian pepperoni',                 cat:'Pizza',  price:42000, recipe:[['flour',280],['tomsauce',120],['mozza',180],['pepperoni',90],['olive',10]] },
    funghi:       { name:'Funghi',            desc:'Mushroom, garlic, parmigiano',                cat:'Pizza',  price:45000, recipe:[['flour',280],['tomsauce',100],['mozza',180],['mushroom',120],['parm',20]] },
    prosciutto_p: { name:'Prosciutto & Rocket',desc:'Mozzarella base, dressed arugula',           cat:'Pizza',  price:52000, recipe:[['flour',280],['mozza',180],['prosciutto',60],['arugula',40],['olive',12]] },
    carbonara:    { name:'Spaghetti Carbonara',desc:'Guanciale, egg, pecorino',                   cat:'Pasta',  price:34000, recipe:[['spaghetti',120],['bacon',60],['egg_yolks',2],['parm',30]] },
    pesto_pasta:  { name:'Pesto Pasta',       desc:'Genovese basil pesto with parm',              cat:'Pasta',  price:30000, recipe:[['spaghetti',120],['pesto',60],['parm',25]] },
    arancini:     { name:'Arancini (3pc)',    desc:'Crispy risotto balls, marinara',              cat:'Antipasti', price:18000, recipe:[['flour',60],['mozza',60],['tomsauce',40]] },
    caprese:      { name:'Caprese Salad',     desc:'Tomato, mozzarella, basil',                   cat:'Antipasti', price:22000, recipe:[['mozza',120],['basil',8],['olive',10]] },
    italian_soda: { name:'Italian Soda',      desc:'Limonata or aranciata',                       cat:'Drinks', price: 9500, recipe:[['soda',1]] },
    wine:         { name:'Glass of Red',      desc:'House Sangiovese',                            cat:'Drinks', price:15000, recipe:[['red_wine',150]] },
    tiramisu:     { name:'Tiramisu',          desc:'Espresso-soaked savoiardi, mascarpone',       cat:'Dolci',  price:16000, recipe:[['tiramisu_stock',1]] },
  },
  dishGroups: {
    pizza:    ['margherita','pepperoni','funghi','prosciutto_p'],
    pasta:    ['carbonara','pesto_pasta'],
    antipasti:['arancini','caprese'],
    drinks:   ['italian_soda','wine'],
    dolci:    ['tiramisu'],
  },
  dayScales: [0.95, 0.85, 1.10, 1.15, 1.30, 1.45, 1.10, 1.00], // Fri/Sat peaks
  slots: [
    { name:'lunch',    count:18, hour:11, window:3, items:[['pizza',0.7],['pasta',0.55],['drinks',0.8]] },
    { name:'mid',      count: 6, hour:14, window:2, items:[['antipasti',0.6],['drinks',0.7]] },
    { name:'aperitivo',count:12, hour:17, window:1, items:[['drinks',1.0],['antipasti',0.7]] },
    { name:'dinner',   count:34, hour:18, window:4, items:[['pizza',0.55],['pasta',0.45],['antipasti',0.35],['drinks',0.85],['dolci',0.22]] },
  ],
  channelMix: { dine_in:0.78, takeout:0.14, delivery:0.08 },
  employees: [
    { key:'aldo',    fullName:'Aldo Marchetti',    role:'Head Pizzaiolo', payType:'monthly', payRate:1800000 },
    { key:'isa',     fullName:'Isabella Cruz',     role:'Server',         payType:'daily',   payRate:  65000 },
    { key:'marco',   fullName:'Marco Santiago',    role:'Server',         payType:'hourly',  payRate:   8500 },
    { key:'paolo',   fullName:'Paolo Rivera',      role:'Dishwasher',     payType:'daily',   payRate:  48000 },
  ],
  payrollPreset: [
    { empKey:'aldo',  days:'6.00', gross:415_385, deductions:24_923 }, // 6/26 × 1.8M
    { empKey:'isa',   days:'6.00', gross:390_000, deductions:23_400 },
    { empKey:'marco', days:'40.0', gross:340_000, deductions:17_000 },
    { empKey:'paolo', days:'6.00', gross:288_000, deductions:14_400 },
  ],
  expensePattern: {
    rentMonthly:      4_500_000,
    dailyIngredient:  650_000,
    monthlyUtilities:  35_000,
    other: { vendor:'Cebu Wines Distributor', amount:120_000, note:'Wine restock' },
    historical: [
      { dayBack:1, category:'ingredients', amount:580_000, vendor:'Italian Larder' },
      { dayBack:2, category:'ingredients', amount:710_000, vendor:'Italian Larder' },
      { dayBack:4, category:'ingredients', amount:540_000, vendor:'Italian Larder' },
      { dayBack:4, category:'utilities',   amount: 32_000, vendor:'Meralco' },
      { dayBack:6, category:'ingredients', amount:670_000, vendor:'Italian Larder' },
    ],
  },
  waste: [
    { ingKey:'mozza',      qty:'250', unit:'g',   reason:'spoilage', cost:22500, note:'Bag punctured', dayBack:0 },
    { ingKey:'tiramisu_stock', qty:'2', unit:'pcs', reason:'dropped', cost:19000, note:'Tray slipped',  dayBack:0 },
    { ingKey:'basil',      qty:'40',  unit:'g',   reason:'spoilage', cost: 3200, note:'Wilted overnight', dayBack:3 },
  ],
}

// ── Kuya Boyong's — PH lutong-bahay / karinderya ────────────────────────────
const karinderya = {
  slug:        'karinderya',
  emailSuffix: 'boyong',
  ownerName:   'Boyong Mendoza',
  venueName:   "Kuya Boyong's Karinderya (SMOKE)",
  menuTheme:   'ember',
  monthlyRevGoal:   38_000_00,
  monthlyExpBudget: 26_000_00,
  dailyRevTarget:    1_300_00,
  foodCostTarget:   38,
  vatRegistered:    false,

  ingredients: [
    { key:'rice',      name:'Rice (raw)',         unit:'g',   cost:6,   stock:25000, low:5000 },
    { key:'chicken',   name:'Chicken (cut)',      unit:'g',   cost:32,  stock:6000,  low:1500 },
    { key:'pork_belly',name:'Pork Belly',         unit:'g',   cost:48,  stock:5000,  low:1200 },
    { key:'oxtail',    name:'Oxtail (buntot)',    unit:'g',   cost:75,  stock:3000,  low:800  },
    { key:'milkfish',  name:'Bangus (fillet)',    unit:'g',   cost:55,  stock:2500,  low:700  },
    { key:'eggs',      name:'Eggs',               unit:'pcs', cost:850, stock:60,    low:20   },
    { key:'soy_sauce', name:'Soy Sauce',          unit:'mL',  cost:5,   stock:2000,  low:500  },
    { key:'vinegar',   name:'Cane Vinegar',       unit:'mL',  cost:4,   stock:1500,  low:400  },
    { key:'garlic',    name:'Garlic',             unit:'g',   cost:18,  stock:600,   low:150  },
    { key:'onion',     name:'Onion',              unit:'g',   cost:10,  stock:1200,  low:300  },
    { key:'tamarind',  name:'Tamarind Mix',       unit:'g',   cost:35,  stock:400,   low:120  },
    { key:'sitaw',     name:'Sitaw (string bean)',unit:'g',   cost:14,  stock:800,   low:200  },
    { key:'kangkong',  name:'Kangkong',           unit:'g',   cost:8,   stock:600,   low:200  },
    { key:'coconut',   name:'Coconut Milk',       unit:'mL',  cost:9,   stock:2500,  low:600  },
    { key:'peanut',    name:'Peanut Sauce Mix',   unit:'g',   cost:40,  stock:300,   low:100  },
    { key:'softdrink', name:'Softdrink (sachet)', unit:'pcs', cost:1800,stock:48,    low:18   },
    { key:'water_btl', name:'Bottled Water',      unit:'pcs', cost: 800,stock:80,    low:25   },
  ],
  dishes: {
    adobo:       { name:'Chicken Adobo',     desc:'Braised in soy-vinegar with garlic',           cat:'Ulam',     price:12000, recipe:[['chicken',180],['soy_sauce',30],['vinegar',25],['garlic',8],['onion',15]] },
    sinigang:    { name:'Sinigang na Baboy', desc:'Sour tamarind soup with pork & kangkong',      cat:'Ulam',     price:14000, recipe:[['pork_belly',180],['tamarind',12],['kangkong',60],['sitaw',30],['onion',20]] },
    kare_kare:   { name:'Kare-Kare',         desc:'Oxtail in peanut-coconut sauce',               cat:'Ulam',     price:18000, recipe:[['oxtail',200],['peanut',25],['coconut',80],['sitaw',40]] },
    bistek:      { name:'Bistek Tagalog',    desc:'Beef strips, onions, calamansi',               cat:'Ulam',     price:16000, recipe:[['chicken',150],['onion',40],['soy_sauce',25],['garlic',6]] },
    lechon_kawali:{name:'Lechon Kawali',     desc:'Deep-fried crispy pork belly',                  cat:'Ulam',     price:15000, recipe:[['pork_belly',180],['vinegar',15],['garlic',8]] },
    bangus:      { name:'Daing na Bangus',   desc:'Marinated milkfish, fried golden',             cat:'Ulam',     price:13000, recipe:[['milkfish',180],['vinegar',20],['garlic',6]] },
    silog:       { name:'Tapsilog',          desc:'Tapa + sinangag + itlog',                       cat:'Silog',    price:11000, recipe:[['chicken',120],['rice',200],['eggs',1],['garlic',5]] },
    tocilog:     { name:'Tocilog',           desc:'Sweet pork tocino with rice and egg',           cat:'Silog',    price:11000, recipe:[['pork_belly',120],['rice',200],['eggs',1]] },
    rice_extra:  { name:'Extra Rice',        desc:'Steamed white rice',                            cat:'Sides',    price: 2500, recipe:[['rice',180]] },
    softdrink:   { name:'Softdrink',         desc:'8oz cup with ice',                              cat:'Drinks',   price: 3500, recipe:[['softdrink',1]] },
    water:       { name:'Bottled Water',     desc:'500mL',                                         cat:'Drinks',   price: 2000, recipe:[['water_btl',1]] },
  },
  dishGroups: {
    ulam:   ['adobo','sinigang','kare_kare','bistek','lechon_kawali','bangus'],
    silog:  ['silog','tocilog'],
    sides:  ['rice_extra'],
    drinks: ['softdrink','water'],
  },
  dayScales: [1.10, 0.95, 1.05, 1.00, 1.20, 1.35, 1.15, 1.00], // payday weekend bump
  slots: [
    { name:'breakfast', count:18, hour: 6, window:3, items:[['silog',1.0],['drinks',0.55]] },
    { name:'lunch',     count:48, hour:11, window:3, items:[['ulam',1.0],['sides',0.6],['drinks',0.75]] },
    { name:'merienda',  count: 8, hour:15, window:2, items:[['silog',0.5],['drinks',0.6]] },
    { name:'dinner',    count:32, hour:18, window:3, items:[['ulam',1.0],['sides',0.55],['drinks',0.7]] },
  ],
  channelMix: { dine_in:0.62, takeout:0.34, delivery:0.04 }, // takeout-heavy
  employees: [
    { key:'aling',  fullName:'Aling Connie Reyes', role:'Kusinera',  payType:'daily',  payRate: 55000 },
    { key:'manong', fullName:'Manong Edgar Cruz',  role:'Server',    payType:'daily',  payRate: 45000 },
    { key:'bong',   fullName:'Bong Saavedra',      role:'Dishwasher',payType:'hourly', payRate:  6500 },
  ],
  payrollPreset: [
    { empKey:'aling',  days:'7.00', gross:385_000, deductions:11_550 },
    { empKey:'manong', days:'7.00', gross:315_000, deductions: 9_450 },
    { empKey:'bong',   days:'42.0', gross:273_000, deductions: 8_190 },
  ],
  expensePattern: {
    rentMonthly:      1_200_000,
    dailyIngredient:  340_000,
    monthlyUtilities:  12_000,
    other: { vendor:'Palengke Run', amount:62_000, note:'Sari-sari + spices' },
    historical: [
      { dayBack:1, category:'ingredients', amount:310_000, vendor:'Marikina Palengke' },
      { dayBack:2, category:'ingredients', amount:360_000, vendor:'Marikina Palengke' },
      { dayBack:3, category:'utilities',   amount: 11_500, vendor:'Manila Water' },
      { dayBack:4, category:'ingredients', amount:320_000, vendor:'Marikina Palengke' },
      { dayBack:6, category:'ingredients', amount:355_000, vendor:'Marikina Palengke' },
    ],
  },
  waste: [
    { ingKey:'rice',     qty:'400', unit:'g',  reason:'spoilage', cost:2400, note:'Overcooked batch',     dayBack:0 },
    { ingKey:'kangkong', qty:'120', unit:'g',  reason:'spoilage', cost: 960, note:'Wilted by closing',    dayBack:1 },
    { ingKey:'chicken',  qty:'150', unit:'g',  reason:'spoilage', cost:4800, note:'Power cut, ref warmed',dayBack:4 },
  ],
}

// ── Boba Lab — bubble tea / dessert shop ────────────────────────────────────
const boba = {
  slug:        'boba',
  emailSuffix: 'cheska',
  ownerName:   'Cheska Lim',
  venueName:   'Boba Lab (SMOKE)',
  menuTheme:   'boba',
  monthlyRevGoal:   62_000_00,
  monthlyExpBudget: 42_000_00,
  dailyRevTarget:    2_100_00,
  foodCostTarget:   30,
  vatRegistered:    false,

  ingredients: [
    { key:'black_tea',  name:'Black Tea Concentrate', unit:'mL',  cost:8,    stock:6000, low:1500 },
    { key:'oolong',     name:'Oolong Tea',            unit:'mL',  cost:10,   stock:4500, low:1200 },
    { key:'green_tea',  name:'Jasmine Green Tea',     unit:'mL',  cost:9,    stock:5000, low:1300 },
    { key:'creamer',    name:'Non-Dairy Creamer',     unit:'mL',  cost:14,   stock:6000, low:1500 },
    { key:'fresh_milk', name:'Fresh Milk',            unit:'mL',  cost:12,   stock:8000, low:2000 },
    { key:'syrup',      name:'Brown Sugar Syrup',     unit:'mL',  cost:18,   stock:3000, low:800  },
    { key:'tapioca',    name:'Tapioca Pearls (raw)',  unit:'g',   cost:14,   stock:4000, low:1000 },
    { key:'popping',    name:'Popping Boba',          unit:'g',   cost:22,   stock:1500, low:400  },
    { key:'taro',       name:'Taro Powder',           unit:'g',   cost:35,   stock:1200, low:400  },
    { key:'matcha_pwd', name:'Matcha Powder',         unit:'g',   cost:60,   stock: 800, low:250  },
    { key:'mango_puree',name:'Mango Purée',           unit:'mL',  cost:25,   stock:2200, low:600  },
    { key:'strawb_puree',name:'Strawberry Purée',     unit:'mL',  cost:28,   stock:2000, low:550  },
    { key:'cheese_foam',name:'Cheese Foam Mix',       unit:'mL',  cost:32,   stock:1800, low:500  },
    { key:'pudding',    name:'Egg Pudding',           unit:'g',   cost:20,   stock:1200, low:350  },
    { key:'cup_22oz',   name:'22oz Cup + Lid',        unit:'pcs', cost:1200, stock: 180, low:50   },
    { key:'straw',      name:'Boba Straw',            unit:'pcs', cost: 400, stock: 240, low:80   },
    { key:'cookie',     name:'Choco Cookie',          unit:'pcs', cost:2800, stock:  40, low:15   },
  ],
  dishes: {
    milk_tea:    { name:'Classic Milk Tea',    desc:'Black tea, creamer, brown sugar, pearls',    cat:'Milk Tea', price:15500, recipe:[['black_tea',180],['creamer',90],['syrup',25],['tapioca',60],['cup_22oz',1],['straw',1]] },
    brown_sugar: { name:'Brown Sugar Boba',    desc:'Fresh milk, caramelized syrup, pearls',       cat:'Milk Tea', price:17500, recipe:[['fresh_milk',220],['syrup',35],['tapioca',70],['cup_22oz',1],['straw',1]] },
    taro_milk:   { name:'Taro Milk',           desc:'Real taro powder, milk, pearls',              cat:'Milk Tea', price:17000, recipe:[['fresh_milk',220],['taro',25],['tapioca',60],['cup_22oz',1],['straw',1]] },
    matcha_latte:{ name:'Matcha Latte',        desc:'Premium matcha, fresh milk',                  cat:'Milk Tea', price:18500, recipe:[['fresh_milk',220],['matcha_pwd',8],['cup_22oz',1],['straw',1]] },
    oolong_cheese:{name:'Oolong Cheese Foam',  desc:'Oolong tea, salted cheese cap',               cat:'Cheese Foam', price:17500, recipe:[['oolong',200],['cheese_foam',60],['cup_22oz',1],['straw',1]] },
    green_cheese:{ name:'Green Tea Cheese Cap',desc:'Jasmine green, salted cheese cap',            cat:'Cheese Foam', price:17500, recipe:[['green_tea',200],['cheese_foam',60],['cup_22oz',1],['straw',1]] },
    mango_yakult:{ name:'Mango Yakult',        desc:'Real mango, cultured drink, popping boba',    cat:'Fruit Tea', price:18000, recipe:[['mango_puree',60],['green_tea',150],['popping',40],['cup_22oz',1],['straw',1]] },
    strawb_fizz: { name:'Strawberry Fizz',     desc:'Strawberry purée, sparkling, popping boba',   cat:'Fruit Tea', price:17000, recipe:[['strawb_puree',60],['green_tea',150],['popping',40],['cup_22oz',1],['straw',1]] },
    add_pearls:  { name:'+ Add Pearls',        desc:'Extra tapioca topping',                       cat:'Add-ons',  price: 2500, recipe:[['tapioca',40]] },
    add_pudding: { name:'+ Egg Pudding',       desc:'Silky egg pudding topping',                   cat:'Add-ons',  price: 3000, recipe:[['pudding',50]] },
    cookie:      { name:'Choco Cookie',        desc:'Soft-baked salted chocolate',                 cat:'Snacks',   price: 7500, recipe:[['cookie',1]] },
  },
  dishGroups: {
    milktea:   ['milk_tea','brown_sugar','taro_milk','matcha_latte'],
    cheese:    ['oolong_cheese','green_cheese'],
    fruit:     ['mango_yakult','strawb_fizz'],
    addons:    ['add_pearls','add_pudding'],
    snacks:    ['cookie'],
  },
  dayScales: [0.95, 0.90, 1.05, 1.10, 1.30, 1.40, 1.25, 1.00], // weekend-heavy mall foot traffic
  slots: [
    { name:'midmorning', count:14, hour:10, window:3, items:[['milktea',0.7],['fruit',0.3]] },
    { name:'lunch',      count:30, hour:12, window:2, items:[['milktea',0.55],['cheese',0.3],['fruit',0.3],['addons',0.35],['snacks',0.18]] },
    { name:'afternoon',  count:42, hour:14, window:4, items:[['milktea',0.5],['cheese',0.25],['fruit',0.35],['addons',0.4],['snacks',0.25]] },
    { name:'evening',    count:22, hour:18, window:3, items:[['milktea',0.6],['fruit',0.25],['addons',0.25]] },
  ],
  channelMix: { dine_in:0.42, takeout:0.46, delivery:0.12 }, // takeout-dominant
  employees: [
    { key:'kim',    fullName:'Kim Aquino',     role:'Barista',   payType:'hourly', payRate: 9000 },
    { key:'janelle',fullName:'Janelle Tan',    role:'Barista',   payType:'hourly', payRate: 8500 },
    { key:'rico',   fullName:'Rico Pascual',   role:'Cashier',   payType:'daily',  payRate:52000 },
  ],
  payrollPreset: [
    { empKey:'kim',     days:'42.0', gross:378_000, deductions:18_900 },
    { empKey:'janelle', days:'36.0', gross:306_000, deductions:15_300 },
    { empKey:'rico',    days:'6.00', gross:312_000, deductions:15_600 },
  ],
  expensePattern: {
    rentMonthly:      3_200_000,
    dailyIngredient:  420_000,
    monthlyUtilities:  22_000,
    other: { vendor:'Packaging Co.', amount:55_000, note:'Cups + lids restock' },
    historical: [
      { dayBack:1, category:'ingredients', amount:380_000, vendor:'Taipei Tea Co.' },
      { dayBack:3, category:'ingredients', amount:440_000, vendor:'Taipei Tea Co.' },
      { dayBack:5, category:'utilities',   amount: 20_000, vendor:'Meralco' },
      { dayBack:6, category:'ingredients', amount:410_000, vendor:'Taipei Tea Co.' },
    ],
  },
  waste: [
    { ingKey:'tapioca',  qty:'300', unit:'g',  reason:'spoilage', cost:4200, note:'4hr rule expired', dayBack:0 },
    { ingKey:'mango_puree', qty:'150', unit:'mL', reason:'overcooked', cost:3750, note:'Caramelized', dayBack:0 },
    { ingKey:'fresh_milk', qty:'400', unit:'mL', reason:'spoilage', cost:4800, note:'Carton expired', dayBack:3 },
  ],
}

// ── Burger House — American smash burgers ───────────────────────────────────
const burger = {
  slug:        'burger',
  emailSuffix: 'jp',
  ownerName:   'JP Hernandez',
  venueName:   "JP's Burger House (SMOKE)",
  menuTheme:   'diner',
  monthlyRevGoal:   72_000_00,
  monthlyExpBudget: 50_000_00,
  dailyRevTarget:    2_400_00,
  foodCostTarget:   36,
  vatRegistered:    true,

  ingredients: [
    { key:'beef_patty', name:'Beef Patty (4oz)',   unit:'pcs', cost:7500, stock:120, low:30 },
    { key:'brioche',    name:'Brioche Bun',        unit:'pcs', cost:2200, stock:100, low:25 },
    { key:'sesame',     name:'Sesame Bun',         unit:'pcs', cost:1800, stock: 80, low:20 },
    { key:'cheddar',    name:'American Cheese',    unit:'pcs', cost:1200, stock:140, low:35 },
    { key:'bacon',      name:'Streaky Bacon',      unit:'g',   cost:80,   stock:1500,low:400 },
    { key:'lettuce',    name:'Iceberg Lettuce',    unit:'g',   cost:14,   stock:800, low:200 },
    { key:'tomato',     name:'Tomato',             unit:'g',   cost:12,   stock:600, low:180 },
    { key:'onion',      name:'Red Onion',          unit:'g',   cost:10,   stock:900, low:250 },
    { key:'pickle',     name:'Dill Pickle',        unit:'g',   cost:20,   stock:400, low:120 },
    { key:'mayo',       name:'Burger Sauce',       unit:'mL',  cost:18,   stock:1500,low:400 },
    { key:'frozen_fry', name:'Frozen Fries',       unit:'g',   cost:18,   stock:8000,low:2000 },
    { key:'onion_ring', name:'Onion Rings (frozen)',unit:'g',  cost:22,   stock:3000,low:800 },
    { key:'milk_shake', name:'Shake Base',         unit:'mL',  cost:16,   stock:4000,low:1000 },
    { key:'choco_syrup',name:'Chocolate Syrup',    unit:'mL',  cost:22,   stock:1500,low:400 },
    { key:'cola_btl',   name:'Cola (bottle)',      unit:'pcs', cost:2200, stock: 60, low:20 },
    { key:'cup_16oz',   name:'16oz Drink Cup',     unit:'pcs', cost: 800, stock:200, low:50 },
  ],
  dishes: {
    classic:    { name:'Classic Smash',     desc:'Single patty, cheddar, sauce',                cat:'Burgers', price:21000, recipe:[['beef_patty',1],['brioche',1],['cheddar',1],['mayo',15],['lettuce',20],['tomato',20],['onion',15]] },
    double:     { name:'Double Smash',      desc:'Two patties, double cheddar',                 cat:'Burgers', price:29000, recipe:[['beef_patty',2],['brioche',1],['cheddar',2],['mayo',20],['lettuce',20],['tomato',20]] },
    bacon_burger:{name:'Bacon Cheese',      desc:'Single patty, bacon, cheddar',                cat:'Burgers', price:27000, recipe:[['beef_patty',1],['brioche',1],['cheddar',1],['bacon',30],['mayo',18]] },
    diner_classic:{name:'Diner Classic',    desc:'Sesame bun, the works',                       cat:'Burgers', price:23000, recipe:[['beef_patty',1],['sesame',1],['cheddar',1],['mayo',18],['lettuce',25],['tomato',20],['onion',15],['pickle',15]] },
    fries:      { name:'Crispy Fries',      desc:'Hand-cut and double-fried',                   cat:'Sides',   price: 9500, recipe:[['frozen_fry',180]] },
    rings:      { name:'Onion Rings',       desc:'Beer-battered, sweet onion',                   cat:'Sides',   price:10500, recipe:[['onion_ring',150]] },
    loaded:     { name:'Loaded Fries',      desc:'Fries, cheese sauce, bacon',                  cat:'Sides',   price:14500, recipe:[['frozen_fry',180],['bacon',30],['cheddar',1]] },
    choco_shake:{ name:'Chocolate Shake',   desc:'Thick chocolate milkshake',                   cat:'Drinks',  price:13000, recipe:[['milk_shake',280],['choco_syrup',40],['cup_16oz',1]] },
    vanilla_shake:{name:'Vanilla Shake',    desc:'Classic Madagascar vanilla',                  cat:'Drinks',  price:13000, recipe:[['milk_shake',280],['cup_16oz',1]] },
    cola:       { name:'Cola',              desc:'Ice-cold bottle',                              cat:'Drinks',  price: 7000, recipe:[['cola_btl',1]] },
  },
  dishGroups: {
    burgers: ['classic','double','bacon_burger','diner_classic'],
    sides:   ['fries','rings','loaded'],
    drinks:  ['choco_shake','vanilla_shake','cola'],
  },
  dayScales: [0.95, 0.90, 1.00, 1.05, 1.25, 1.40, 1.30, 1.00],
  slots: [
    { name:'lunch',     count:32, hour:11, window:3, items:[['burgers',1.0],['sides',0.8],['drinks',0.75]] },
    { name:'afternoon', count:12, hour:14, window:3, items:[['sides',0.7],['drinks',0.85]] },
    { name:'dinner',    count:42, hour:17, window:4, items:[['burgers',1.0],['sides',0.85],['drinks',0.78]] },
  ],
  channelMix: { dine_in:0.55, takeout:0.30, delivery:0.15 },
  employees: [
    { key:'mig',   fullName:'Miguel Salazar',   role:'Line Cook', payType:'monthly', payRate:1_500_000 },
    { key:'jay',   fullName:'Jay Aquino',       role:'Server',    payType:'daily',   payRate:  60000 },
    { key:'cathy', fullName:'Cathy Rosales',    role:'Cashier',   payType:'hourly',  payRate:   8000 },
    { key:'lemuel',fullName:'Lemuel Garcia',    role:'Dishwasher',payType:'daily',   payRate:  45000 },
  ],
  payrollPreset: [
    { empKey:'mig',    days:'6.00', gross:346_154, deductions:20_769 },
    { empKey:'jay',    days:'6.00', gross:360_000, deductions:18_000 },
    { empKey:'cathy',  days:'40.0', gross:320_000, deductions:16_000 },
    { empKey:'lemuel', days:'6.00', gross:270_000, deductions:13_500 },
  ],
  expensePattern: {
    rentMonthly:      3_800_000,
    dailyIngredient:  520_000,
    monthlyUtilities:  28_000,
    other: { vendor:'McCain Foods', amount:85_000, note:'Frozen fries pallet' },
    historical: [
      { dayBack:1, category:'ingredients', amount:480_000, vendor:'PrimeBeef Mfg.' },
      { dayBack:2, category:'ingredients', amount:520_000, vendor:'PrimeBeef Mfg.' },
      { dayBack:4, category:'utilities',   amount: 25_000, vendor:'Meralco' },
      { dayBack:5, category:'ingredients', amount:540_000, vendor:'PrimeBeef Mfg.' },
    ],
  },
  waste: [
    { ingKey:'beef_patty', qty:'3',  unit:'pcs', reason:'overcooked', cost:22500, note:'Burnt batch', dayBack:0 },
    { ingKey:'frozen_fry', qty:'400',unit:'g',   reason:'dropped',    cost: 7200, note:'Basket spill',dayBack:1 },
    { ingKey:'brioche',    qty:'4',  unit:'pcs', reason:'spoilage',   cost: 8800, note:'Moldy bag',   dayBack:5 },
  ],
}

// ── Nanay Pacing — Filipino bakery (panaderia) ──────────────────────────────
const bakery = {
  slug:        'bakery',
  emailSuffix: 'pacing',
  ownerName:   'Pacing Domingo',
  venueName:   "Nanay Pacing's Bakery (SMOKE)",
  menuTheme:   'linen',
  monthlyRevGoal:   45_000_00,
  monthlyExpBudget: 32_000_00,
  dailyRevTarget:    1_500_00,
  foodCostTarget:   34,
  vatRegistered:    false,

  ingredients: [
    { key:'flour',   name:'Bread Flour',       unit:'g',   cost:3,   stock:30000, low:6000 },
    { key:'sugar',   name:'White Sugar',       unit:'g',   cost:6,   stock:8000,  low:2000 },
    { key:'brown_sugar',name:'Brown Sugar',    unit:'g',   cost:8,   stock:4000,  low:1000 },
    { key:'yeast',   name:'Instant Yeast',     unit:'g',   cost:50,  stock:600,   low:150  },
    { key:'butter',  name:'Butter',            unit:'g',   cost:60,  stock:2500,  low:600  },
    { key:'eggs',    name:'Eggs',              unit:'pcs', cost:850, stock:120,   low:30   },
    { key:'milk',    name:'Fresh Milk',        unit:'mL',  cost:12,  stock:6000,  low:1500 },
    { key:'salt',    name:'Salt',              unit:'g',   cost:3,   stock:800,   low:200  },
    { key:'cheese_pdr',name:'Cheese Powder',   unit:'g',   cost:55,  stock:1000,  low:250  },
    { key:'ube_jam', name:'Ube Halaya',        unit:'g',   cost:40,  stock:1500,  low:400  },
    { key:'choco_chips',name:'Chocolate Chips',unit:'g',   cost:45,  stock:1800,  low:500  },
    { key:'coconut_strips',name:'Coconut Strips',unit:'g', cost:30,  stock:600,   low:180  },
    { key:'pineapple_jam',name:'Pineapple Jam', unit:'g',  cost:38,  stock: 900,  low:250  },
    { key:'coffee_arabica',name:'Brewed Coffee', unit:'mL',cost: 6,  stock:3000,  low:800  },
  ],
  dishes: {
    pandesal:    { name:'Pandesal (4pc)',   desc:'Classic Pinoy bread roll',                     cat:'Bread',     price: 2000, recipe:[['flour',120],['sugar',15],['yeast',2],['salt',1.5],['butter',12]] },
    ensaymada:   { name:'Ensaymada',        desc:'Buttery sweet bread, cheese topping',          cat:'Sweet',     price: 4500, recipe:[['flour',90],['butter',30],['sugar',25],['eggs',1],['cheese_pdr',12]] },
    cheese_roll: { name:'Cheese Roll',      desc:'Sweet bread filled with cheese',               cat:'Sweet',     price: 3500, recipe:[['flour',80],['butter',18],['sugar',20],['cheese_pdr',15]] },
    ube_pdesal:  { name:'Ube Pandesal',     desc:'Pandesal with ube halaya filling',             cat:'Sweet',     price: 3500, recipe:[['flour',100],['ube_jam',25],['sugar',15],['butter',10]] },
    spanish_bun: { name:'Spanish Bun',      desc:'Coiled sugar-buttered roll',                   cat:'Sweet',     price: 3500, recipe:[['flour',85],['butter',25],['brown_sugar',22],['eggs',1]] },
    cinnaroll:   { name:'Cinnamon Roll',    desc:'Soft swirl with cinnamon-butter glaze',        cat:'Sweet',     price: 6500, recipe:[['flour',90],['butter',30],['brown_sugar',25],['eggs',1]] },
    pan_coco:    { name:'Pan de Coco',      desc:'Sweet bread filled with sweetened coconut',    cat:'Sweet',     price: 3000, recipe:[['flour',85],['butter',15],['sugar',15],['coconut_strips',20]] },
    pineapple_bun:{name:'Hopia Hapon',      desc:'Pineapple-jam filled flaky pastry',            cat:'Pastry',    price: 4500, recipe:[['flour',70],['butter',25],['pineapple_jam',30]] },
    choco_cookie:{ name:'Choco Cookie',     desc:'Soft-baked, big chips',                        cat:'Cookies',   price: 5000, recipe:[['flour',60],['butter',25],['brown_sugar',30],['eggs',1],['choco_chips',25]] },
    brewed:      { name:'Brewed Coffee',    desc:'House blend, hot or iced',                     cat:'Drinks',    price: 7500, recipe:[['coffee_arabica',200]] },
    milk_cup:    { name:'Cup of Milk',      desc:'Cold fresh milk',                              cat:'Drinks',    price: 5500, recipe:[['milk',220]] },
  },
  dishGroups: {
    bread:   ['pandesal'],
    sweet:   ['ensaymada','cheese_roll','ube_pdesal','spanish_bun','cinnaroll','pan_coco'],
    pastry:  ['pineapple_bun'],
    cookies: ['choco_cookie'],
    drinks:  ['brewed','milk_cup'],
  },
  // Bakery rush: huge morning, slow afternoon, modest merienda bump
  dayScales: [1.05, 1.00, 1.05, 1.00, 1.10, 1.30, 1.20, 1.00],
  slots: [
    { name:'dawn',      count:62, hour: 5, window:3, items:[['bread',1.0],['sweet',0.4],['drinks',0.3]] },
    { name:'morning',   count:38, hour: 8, window:3, items:[['bread',0.6],['sweet',0.7],['pastry',0.3],['drinks',0.5]] },
    { name:'midday',    count:14, hour:11, window:2, items:[['sweet',0.6],['pastry',0.3],['cookies',0.3],['drinks',0.6]] },
    { name:'merienda',  count:28, hour:15, window:2, items:[['sweet',0.7],['pastry',0.35],['cookies',0.35],['drinks',0.5]] },
    { name:'closing',   count: 8, hour:18, window:1, items:[['bread',0.6],['sweet',0.4]] },
  ],
  channelMix: { dine_in:0.18, takeout:0.78, delivery:0.04 }, // takeout-dominant
  employees: [
    { key:'tito_ben', fullName:'Tito Ben Salazar', role:'Head Baker',    payType:'monthly', payRate:1_600_000 },
    { key:'rose',     fullName:'Rose Magbanua',    role:'Counter Staff', payType:'daily',   payRate:  48000 },
    { key:'inay',     fullName:'Inay Loring',      role:'Counter Staff', payType:'daily',   payRate:  48000 },
  ],
  payrollPreset: [
    { empKey:'tito_ben', days:'7.00', gross:430_769, deductions:25_846 },
    { empKey:'rose',     days:'7.00', gross:336_000, deductions:16_800 },
    { empKey:'inay',     days:'6.00', gross:288_000, deductions:14_400 },
  ],
  expensePattern: {
    rentMonthly:      1_800_000,
    dailyIngredient:  280_000,
    monthlyUtilities:  14_000,
    other: { vendor:'Pilmico Flour Mills', amount:90_000, note:'Bulk flour delivery' },
    historical: [
      { dayBack:1, category:'ingredients', amount:240_000, vendor:'Pilmico Flour Mills' },
      { dayBack:3, category:'ingredients', amount:280_000, vendor:'Pilmico Flour Mills' },
      { dayBack:4, category:'utilities',   amount: 13_500, vendor:'Meralco' },
      { dayBack:6, category:'ingredients', amount:260_000, vendor:'Pilmico Flour Mills' },
    ],
  },
  waste: [
    { ingKey:'flour',  qty:'500', unit:'g',  reason:'overcooked', cost:1500, note:'Oven too hot batch 3', dayBack:0 },
    { ingKey:'butter', qty:'200', unit:'g',  reason:'spoilage', cost:12000, note:'Left on counter',   dayBack:1 },
    { ingKey:'milk',   qty:'300', unit:'mL', reason:'spoilage', cost: 3600, note:'Carton expired',    dayBack:4 },
  ],
}

// ── Ramen Yokocho — Japanese ramen-ya ────────────────────────────────────────
const ramen = {
  slug:        'ramen',
  emailSuffix: 'kenji',
  ownerName:   'Kenji Tanaka',
  venueName:   'Ramen Yokocho (SMOKE)',
  menuTheme:   'imperial',
  monthlyRevGoal:   95_000_00,
  monthlyExpBudget: 68_000_00,
  dailyRevTarget:    3_200_00,
  foodCostTarget:   33,
  vatRegistered:    true,

  ingredients: [
    { key:'tonkotsu_broth', name:'Tonkotsu Broth',    unit:'mL',  cost:12,  stock:30000, low:6000 },
    { key:'shoyu_broth',    name:'Shoyu Broth',       unit:'mL',  cost:10,  stock:18000, low:4000 },
    { key:'miso_paste',     name:'Spicy Miso Paste',  unit:'g',   cost:42,  stock:1200,  low:300  },
    { key:'noodles_fresh',  name:'Fresh Ramen Noodles',unit:'g',  cost:22,  stock:18000, low:4000 },
    { key:'chashu',         name:'Chashu (pork belly)',unit:'g',  cost:75,  stock:3500,  low:800  },
    { key:'menma',          name:'Menma (bamboo)',    unit:'g',   cost:30,  stock:1000,  low:250  },
    { key:'aji_egg',        name:'Ajitsuke Tamago',   unit:'pcs', cost:2500,stock:  60,  low:20   },
    { key:'nori',           name:'Nori Sheets',       unit:'pcs', cost: 600,stock: 240,  low:60   },
    { key:'scallion',       name:'Green Onion',       unit:'g',   cost:18,  stock:1200,  low:300  },
    { key:'bean_sprout',    name:'Bean Sprouts',      unit:'g',   cost:12,  stock:1500,  low:400  },
    { key:'gyoza_raw',      name:'Gyoza (frozen)',    unit:'pcs', cost:1100,stock:280,   low:80   },
    { key:'rice_steam',     name:'Steamed Rice',      unit:'g',   cost: 8,  stock:10000, low:2500 },
    { key:'karaage_raw',    name:'Karaage (marinated)',unit:'g',  cost:48,  stock:3200,  low:800  },
    { key:'salmon',         name:'Salmon (sashimi)',  unit:'g',   cost:140, stock:1800,  low:450  },
    { key:'matcha_pwd',     name:'Matcha Powder',     unit:'g',   cost:80,  stock: 800,  low:200  },
    { key:'green_tea',      name:'Sencha Tea Leaves', unit:'g',   cost:45,  stock: 600,  low:150  },
    { key:'sapporo',        name:'Sapporo Beer (btl)',unit:'pcs', cost:8500,stock:  90,  low:25   },
  ],
  dishes: {
    tonkotsu:      { name:'Tonkotsu Ramen',     desc:'18hr pork bone broth, chashu, menma, egg',     cat:'Ramen',  price:48000, recipe:[['tonkotsu_broth',450],['noodles_fresh',180],['chashu',60],['menma',20],['aji_egg',1],['scallion',8],['nori',1]] },
    shoyu:         { name:'Shoyu Ramen',        desc:'Classic soy-based broth',                       cat:'Ramen',  price:42000, recipe:[['shoyu_broth',450],['noodles_fresh',180],['chashu',60],['menma',20],['scallion',8],['nori',1]] },
    spicy_miso:    { name:'Spicy Miso',         desc:'Pork broth, miso, chili, sprouts',              cat:'Ramen',  price:46000, recipe:[['tonkotsu_broth',400],['miso_paste',35],['noodles_fresh',180],['bean_sprout',40],['scallion',8]] },
    karaage_ramen: { name:'Karaage Ramen',      desc:'Shoyu broth with crispy chicken',               cat:'Ramen',  price:50000, recipe:[['shoyu_broth',450],['noodles_fresh',180],['karaage_raw',120],['scallion',8]] },
    extra_chashu:  { name:'+ Extra Chashu',     desc:'2 extra slices',                                 cat:'Add-ons',price: 9500, recipe:[['chashu',50]] },
    extra_egg:     { name:'+ Extra Aji Egg',    desc:'Marinated soft-boiled',                          cat:'Add-ons',price: 6500, recipe:[['aji_egg',1]] },
    gyoza:         { name:'Pork Gyoza (5pc)',   desc:'Pan-seared dumplings',                          cat:'Sides',  price:18500, recipe:[['gyoza_raw',5]] },
    karaage:       { name:'Karaage Plate',      desc:'Japanese fried chicken, mayo',                  cat:'Sides',  price:22500, recipe:[['karaage_raw',180],['rice_steam',150]] },
    sashimi:       { name:'Salmon Sashimi',     desc:'5pc fresh-cut salmon',                          cat:'Sides',  price:32000, recipe:[['salmon',90]] },
    matcha_ice:    { name:'Matcha Soft Serve',  desc:'House matcha, low-sugar',                       cat:'Dessert',price:14500, recipe:[['matcha_pwd',5]] },
    green_tea:     { name:'Sencha Tea',         desc:'Hot, free refill',                              cat:'Drinks', price: 7500, recipe:[['green_tea',5]] },
    sapporo:       { name:'Sapporo Beer',       desc:'Cold bottled lager',                            cat:'Drinks', price:18000, recipe:[['sapporo',1]] },
  },
  dishGroups: {
    ramen:   ['tonkotsu','shoyu','spicy_miso','karaage_ramen'],
    addons:  ['extra_chashu','extra_egg'],
    sides:   ['gyoza','karaage','sashimi'],
    drinks:  ['green_tea','sapporo'],
    dessert: ['matcha_ice'],
  },
  dayScales: [0.90, 0.85, 0.95, 1.05, 1.30, 1.50, 1.20, 1.00], // big Fri/Sat dinner
  slots: [
    { name:'lunch',  count:32, hour:11, window:2, items:[['ramen',1.0],['addons',0.4],['sides',0.45],['drinks',0.6]] },
    { name:'mid',    count: 6, hour:14, window:2, items:[['sides',0.5],['drinks',0.4],['dessert',0.3]] },
    { name:'dinner', count:48, hour:18, window:4, items:[['ramen',1.0],['addons',0.5],['sides',0.55],['drinks',0.7],['dessert',0.18]] },
  ],
  channelMix: { dine_in:0.82, takeout:0.13, delivery:0.05 },
  employees: [
    { key:'sora',  fullName:'Sora Yamazaki',   role:'Head Chef',  payType:'monthly', payRate:2_000_000 },
    { key:'hana',  fullName:'Hana Reyes',      role:'Sous Chef',  payType:'monthly', payRate:1_400_000 },
    { key:'taka',  fullName:'Taka Fernandez',  role:'Server',     payType:'daily',   payRate:  72000 },
    { key:'nori',  fullName:'Nori Villanueva', role:'Server',     payType:'hourly',  payRate:   9500 },
  ],
  payrollPreset: [
    { empKey:'sora', days:'6.00', gross:461_538, deductions:27_692 },
    { empKey:'hana', days:'6.00', gross:323_077, deductions:19_385 },
    { empKey:'taka', days:'6.00', gross:432_000, deductions:25_920 },
    { empKey:'nori', days:'38.0', gross:361_000, deductions:18_050 },
  ],
  expensePattern: {
    rentMonthly:      6_200_000,
    dailyIngredient:  820_000,
    monthlyUtilities:  42_000,
    other: { vendor:'Nihon Imports', amount:180_000, note:'Sapporo + sake restock' },
    historical: [
      { dayBack:1, category:'ingredients', amount:780_000, vendor:'Tokyo Pantry' },
      { dayBack:2, category:'ingredients', amount:840_000, vendor:'Tokyo Pantry' },
      { dayBack:3, category:'utilities',   amount: 38_000, vendor:'Meralco' },
      { dayBack:5, category:'ingredients', amount:900_000, vendor:'Tokyo Pantry' },
      { dayBack:6, category:'ingredients', amount:760_000, vendor:'Tokyo Pantry' },
    ],
  },
  waste: [
    { ingKey:'noodles_fresh', qty:'400', unit:'g', reason:'overcooked', cost:8800, note:'Pot boiled over',   dayBack:0 },
    { ingKey:'salmon',        qty:'120', unit:'g', reason:'spoilage',   cost:16800, note:'Above 4°C 4hrs',    dayBack:0 },
    { ingKey:'tonkotsu_broth',qty:'500', unit:'mL',reason:'dropped',    cost: 6000, note:'Stockpot spilled', dayBack:2 },
  ],
}

// ── Registry ─────────────────────────────────────────────────────────────────
export const themes = {
  cafe,
  pizzeria,
  karinderya,
  boba,
  burger,
  bakery,
  ramen,
}

export const themeSlugs = Object.keys(themes)

export function getTheme(slug) {
  const t = themes[slug]
  if (!t) throw new Error(`Unknown theme: "${slug}". Available: ${themeSlugs.join(', ')}`)
  return t
}
