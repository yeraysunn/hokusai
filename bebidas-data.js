// Bebidas de la carta (página Carta y panel de admin). [nombre, precio, imagen/nota]
const SHELVES = [
  { jp: '清涼', label: 'Refrescos', tag: '', items: [['Agua', 2.65, 'agua'], ['Agua con gas · Vichy Catalán', 2.8, 'vichy'], ['Coca-Cola', 3, 'coca'], ['Coca-Cola Zero', 3, 'zero'], ['Fanta Naranja / Limón', 3, 'fanta'], ['Nestea Limón', 3, 'nestea'], ['Aquarius Limón', 3, 'aquarius'], ['Aquarius Naranja', 3, 'aquariusn'], ['Sprite', 3, 'sprite'], ['Tónica', 3, 'tonica']] },
  { jp: 'お茶', label: 'Tés y refrescos asiáticos', tag: '', items: [['Oicha Té Verde', 3.5, 'oichaverde'], ['Oicha Té Rojo', 3.5, 'oicharojo'], ['Oicha Té Jazmín', 3.5, 'oichajazmin'], ['Wang Laoji', 3.5, 'wanglaoji'], ['Leche Wangzai', 3.5, 'wangzai'], ['Leche de Coco', 3.5, 'coco']] },
  { jp: 'ラムネ', label: 'Ramune', tag: 'La de la canica', items: [['Original', 3.95, 'r_original'], ['Fresa', 3.95, 'r_fresa'], ['Melón', 3.95, 'r_melon'], ['Sandía', 3.95, 'r_fresa'], ['Naranja', 3.95, 'r_naranja'], ['Lychee', 3.95, 'r_lychee']] }
];
const MIX = 'Anís, Baileys, Ron, Brandy o Whisky';
const LISTS = [
  { jp: 'ジュース', label: 'Zumos', icon: 'ph-bold ph-orange-slice', rows: [['Naranja', 2.8], ['Piña', 2.8], ['Melocotón', 2.8], ['Manzana', 2.8]] },
  { jp: '生ビール', label: 'Cerveza de barril', icon: 'ph-bold ph-beer-stein', rows: [['Copa de cerveza', 2.9], ['Copa con limón', 3], ['Jarra de cerveza', 4.95], ['Jarra con limón', 4.95]] },
  { jp: 'ビール', label: 'Cervezas especiales', icon: 'ph-bold ph-beer-bottle', rows: [['Cerveza japonesa', 3.5], ['Cerveza doble malta', 3.15], ['Cerveza sin alcohol', 3.15]] },
  { jp: '酒', label: 'Sake', icon: 'ph-bold ph-wine', rows: [['Chupito de sake', 3.5], ['Jarra de sake', 9.5], ['Botella de sake 300 ml', 13.95], ['Botella de sake 720 ml', 38]] },
  { jp: '白', label: 'Vinos blancos', icon: 'ph-bold ph-wine', rows: [['Poesia Blanco', 14], ['Verdejo', 15.5], ['Blanc Pescador', 21.9], ['Albariño Lagar do Frade', 33.9]] },
  { jp: 'ロゼ', label: 'Vinos rosados', icon: 'ph-bold ph-wine', rows: [['Poesia Rosado', 14], ['Lambrusco', 15.9], ['Cresta Rosa', 18.5], ['Gran Feudo', 22.9]] },
  { jp: '赤', label: 'Vinos tintos', icon: 'ph-bold ph-wine', rows: [['Poesia Tinto', 14], ['Don Barbe Negre', 15.9], ['Abid Negre', 19.9], ['Vega Nazcan Roble', 30.9]] },
  { jp: '泡', label: 'Cava', icon: 'ph-bold ph-champagne', rows: [['Rigol', 18], ['Sant Manel Brut Nature', 22]] },
  { jp: 'ウイスキー', label: 'Whisky', icon: 'ph-bold ph-brandy', rows: [['JB / Cutty Sark', 7.5], ['Red Label / Ballantine’s', 8], ['Black Label / Jack Daniel’s', 10], ['Chivas 12 / Cardhu 12', 13]] },
  { jp: 'ラム', label: 'Ron', icon: 'ph-bold ph-anchor', rows: [['Negrita', 7.5], ['Cacique / Brugal / Barceló / Bacardi', 8]] },
  { jp: 'ジン', label: 'Ginebra', icon: 'ph-bold ph-plant', rows: [['Larios', 7.5], ['Bombay / Beefeater / Puerto de Indias Fresa', 8], ['Hendrick’s', 15]] },
  { jp: 'ウォッカ', label: 'Vodka', icon: 'ph-bold ph-cube', rows: [['Smirnoff', 8], ['Absolut', 9]] },
  { jp: 'ブランデー', label: 'Brandy / Coñac', icon: 'ph-bold ph-brandy', rows: [['Soberano / Terry', 7.5], ['Veterano / Magno', 8]] },
  { jp: 'リキュール', label: 'Licores', icon: 'ph-bold ph-flower', rows: [['Malibu / Baileys / Licor 43 / Jägermeister', 8]] },
  { jp: 'コーヒー', label: 'Cafés', icon: 'ph-bold ph-coffee', rows: [['Café solo', 2], ['Café largo / corto / americano', 2.15], ['Cortado', 2.25], ['Café con leche', 2.35], ['Café bombón', 2.85], ['Trifásico', 3.55, MIX], ['Carajillo', 3.55, MIX]] },
  { jp: '茶', label: 'Tés e infusiones', icon: 'ph-bold ph-tea-bag', rows: [['Té rojo', 2.75], ['Té verde', 2.75], ['Menta poleo / Manzanilla', 2.75], ['Té japonés', 2.95]] }
];

export { SHELVES, MIX, LISTS };
