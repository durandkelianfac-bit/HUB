// Moteur de classification des rayons courses (indépendant de l'interface, testable avec Node).
// Exposé en UMD : window.Aisles.classify(titre, appris)
(function(root, factory){
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.Aisles=factory();
})(typeof self!=='undefined'?self:this, function(){
  'use strict';

  // 1. Normalisation
  const STOP=new Set(['de','du','des','la','le','les','un','une','au','aux','a','en','d','l','et','sans','avec','bio','frais','petit','grand','gros','le','la','les','des','du','au','aux']);
  const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

  function tokens(s){
    return norm(s).split(' ').filter(w=>w && !STOP.has(w));
  }

  // 2. Expressions multi-mots (ordre important : les plus longues d'abord pour le match)
  // Utilisées à l'étape (d) : match de sous-chaîne exacte sur le titre normalisé complet
  const EXPR=[
    ['creme solaire', 'Hygiène et beauté'],
    ['pate a tartiner', 'Épicerie sucrée et petit-déj'],
    ['papier toilette', 'Hygiène et beauté'],
    ['papier wc', 'Hygiène et beauté'],
    ['haricots verts', 'Fruits et légumes'],
    ['jus d orange', 'Boissons'],
    ['pain de mie', 'Boulangerie et pâtisserie'],
    ['lait entier', 'Crèmerie'],
    ['lait demi ecreme', 'Crèmerie'],
    ['lait ecreme', 'Crèmerie'],
    ['yaourt nature', 'Crèmerie'],
    ['yaourt fruit', 'Crèmerie'],
    ['fromage rape', 'Crèmerie'],
    ['steak hache', 'Boucherie et poissonnerie'],
    ['filet poulet', 'Boucherie et poissonnerie'],
    ['cuisse poulet', 'Boucherie et poissonnerie'],
    ['aile poulet', 'Boucherie et poissonnerie'],
    ['escalope poulet', 'Boucherie et poissonnerie'],
    ['cote porc', 'Boucherie et poissonnerie'],
    ['roti porc', 'Boucherie et poissonnerie'],
    ['jambon blanc', 'Charcuterie et traiteur'],
    ['jambon cru', 'Charcuterie et traiteur'],
    ['saucisse fumee', 'Charcuterie et traiteur'],
    ['saucisse de toulouse', 'Charcuterie et traiteur'],
    ['pate feuilletée', 'Boulangerie et pâtisserie'],
    ['pate brisee', 'Boulangerie et pâtisserie'],
    ['pate a pizza', 'Boulangerie et pâtisserie'],
    ['riz basmati', 'Épicerie salée'],
    ['riz complet', 'Épicerie salée'],
    ['pates penne', 'Épicerie salée'],
    ['pates fusilli', 'Épicerie salée'],
    ['pates spaghetti', 'Épicerie salée'],
    ['farine t55', 'Épicerie salée'],
    ['farine complete', 'Épicerie salée'],
    ['huile olive', 'Épicerie salée'],
    ['huile tournesol', 'Épicerie salée'],
    ['vinaigre balsamique', 'Épicerie salée'],
    ['vinaigre vin', 'Épicerie salée'],
    ['sucre roux', 'Épicerie sucrée et petit-déj'],
    ['sucre glace', 'Épicerie sucrée et petit-déj'],
    ['chocolat noir', 'Épicerie sucrée et petit-déj'],
    ['chocolat lait', 'Épicerie sucrée et petit-déj'],
    ['biscuit petit dejeuner', 'Épicerie sucrée et petit-déj'],
    ['cereales petit dejeuner', 'Épicerie sucrée et petit-déj'],
    ['confiture fraise', 'Épicerie sucrée et petit-déj'],
    ['confiture abricot', 'Épicerie sucrée et petit-déj'],
    ['miel fleurs', 'Épicerie sucrée et petit-déj'],
    ['cafe grain', 'Épicerie sucrée et petit-déj'],
    ['cafe moule', 'Épicerie sucrée et petit-déj'],
    ['the vert', 'Épicerie sucrée et petit-déj'],
    ['the noir', 'Épicerie sucrée et petit-déj'],
    ['jus pomme', 'Boissons'],
    ['jus raisin', 'Boissons'],
    ['eau minerale', 'Boissons'],
    ['eau gazeuse', 'Boissons'],
    ['soda cola', 'Boissons'],
    ['biere blonde', 'Boissons'],
    ['vin rouge', 'Boissons'],
    ['vin blanc', 'Boissons'],
    ['sirop menthe', 'Boissons'],
    ['sirop grenadine', 'Boissons'],
    ['lessive liquide', 'Entretien et maison'],
    ['lessive poudre', 'Entretien et maison'],
    ['liquide vaisselle', 'Entretien et maison'],
    ['produit nettoyant', 'Entretien et maison'],
    ['sac poubelle', 'Entretien et maison'],
    ['papier aluminium', 'Entretien et maison'],
    ['film etirable', 'Entretien et maison'],
    ['eponge grattante', 'Entretien et maison'],
    ['shampoing', 'Hygiène et beauté'],
    ['gel douche', 'Hygiène et beauté'],
    ['savon mains', 'Hygiène et beauté'],
    ['dentifrice', 'Hygiène et beauté'],
    ['brosse dents', 'Hygiène et beauté'],
    ['deodorant', 'Hygiène et beauté'],
    ['coton tige', 'Hygiène et beauté'],
    ['mouchoir papier', 'Hygiène et beauté'],
    ['serviette hygienique', 'Hygiène et beauté'],
    ['tampon', 'Hygiène et beauté'],
    ['rasoir', 'Hygiène et beauté'],
    ['creme visage', 'Hygiène et beauté'],
    ['lait corps', 'Hygiène et beauté'],
    ['pain baguette', 'Boulangerie et pâtisserie'],
    ['pain complet', 'Boulangerie et pâtisserie'],
    ['pain cereales', 'Boulangerie et pâtisserie'],
    ['brioche', 'Boulangerie et pâtisserie'],
    ['croissant', 'Boulangerie et pâtisserie'],
    ['viennoiserie', 'Boulangerie et pâtisserie'],
    ['gateau', 'Boulangerie et pâtisserie'],
    ['tarte', 'Boulangerie et pâtisserie'],
    ['brownie', 'Boulangerie et pâtisserie'],
    ['muffin', 'Boulangerie et pâtisserie'],
  ];

  // 3. Dictionnaire mots-clés simples (un seul mot, sans espace)
  // Utilisé à l'étape (e) : correspondance par préfixe (mots >= 4) ou exacte (mots < 4)
  // Le plus long mot-clé gagne
  const WORDS={
    // Fruits et légumes
    'pomme': 'Fruits et légumes',
    'banane': 'Fruits et légumes',
    'orange': 'Fruits et légumes',
    'citron': 'Fruits et légumes',
    'poire': 'Fruits et légumes',
    'fraise': 'Fruits et légumes',
    'framboise': 'Fruits et légumes',
    'raisin': 'Fruits et légumes',
    'tomate': 'Fruits et légumes',
    'salade': 'Fruits et légumes',
    'laitue': 'Fruits et légumes',
    'carotte': 'Fruits et légumes',
    'courgette': 'Fruits et légumes',
    'oignon': 'Fruits et légumes',
    'ail': 'Fruits et légumes',
    'poireau': 'Fruits et légumes',
    'champignon': 'Fruits et légumes',
    'concombre': 'Fruits et légumes',
    'poivron': 'Fruits et légumes',
    'aubergine': 'Fruits et légumes',
    'brocoli': 'Fruits et légumes',
    'chou': 'Fruits et légumes',
    'avocat': 'Fruits et légumes',
    'fruit': 'Fruits et légumes',
    'legume': 'Fruits et légumes',
    'persil': 'Fruits et légumes',
    'basilic': 'Fruits et légumes',
    'clementine': 'Fruits et légumes',
    'kiwi': 'Fruits et légumes',
    'mangue': 'Fruits et légumes',
    'ananas': 'Fruits et légumes',
    'melon': 'Fruits et légumes',
    'patate': 'Fruits et légumes',
    'echalote': 'Fruits et légumes',
    'epinard': 'Fruits et légumes',
    'epinards': 'Fruits et légumes',
    'radis': 'Fruits et légumes',
    'celeri': 'Fruits et légumes',
    'courge': 'Fruits et légumes',

    // Crèmerie
    'lait': 'Crèmerie',
    'yaourt': 'Crèmerie',
    'yogourt': 'Crèmerie',
    'fromage': 'Crèmerie',
    'beurre': 'Crèmerie',
    'creme': 'Crèmerie',
    'oeuf': 'Crèmerie',
    'emmental': 'Crèmerie',
    'mozzarella': 'Crèmerie',
    'skyr': 'Crèmerie',
    'gruyere': 'Crèmerie',
    'parmesan': 'Crèmerie',
    'chevre': 'Crèmerie',
    'camembert': 'Crèmerie',
    'faisselle': 'Crèmerie',

    // Boucherie et poissonnerie
    'poulet': 'Boucherie et poissonnerie',
    'boeuf': 'Boucherie et poissonnerie',
    'steak': 'Boucherie et poissonnerie',
    'viande': 'Boucherie et poissonnerie',
    'porc': 'Boucherie et poissonnerie',
    'veau': 'Boucherie et poissonnerie',
    'agneau': 'Boucherie et poissonnerie',
    'dinde': 'Boucherie et poissonnerie',
    'hache': 'Boucherie et poissonnerie',
    'saumon': 'Boucherie et poissonnerie',
    'poisson': 'Boucherie et poissonnerie',
    'crevette': 'Boucherie et poissonnerie',
    'thon': 'Boucherie et poissonnerie',
    'cabillaud': 'Boucherie et poissonnerie',
    'merlu': 'Boucherie et poissonnerie',
    'escalope': 'Boucherie et poissonnerie',
    'cote': 'Boucherie et poissonnerie',
    'roti': 'Boucherie et poissonnerie',
    'aile': 'Boucherie et poissonnerie',

    // Charcuterie et traiteur
    'jambon': 'Charcuterie et traiteur',
    'saucisson': 'Charcuterie et traiteur',
    'lardon': 'Charcuterie et traiteur',
    'chorizo': 'Charcuterie et traiteur',
    'pate': 'Charcuterie et traiteur',
    'rillettes': 'Charcuterie et traiteur',
    'bacon': 'Charcuterie et traiteur',
    'saucisse': 'Charcuterie et traiteur',
    'traiteur': 'Charcuterie et traiteur',
    'knack': 'Charcuterie et traiteur',

    // Boissons
    'jus': 'Boissons',
    'eau': 'Boissons',
    'soda': 'Boissons',
    'coca': 'Boissons',
    'biere': 'Boissons',
    'vin': 'Boissons',
    'sirop': 'Boissons',
    'limonade': 'Boissons',
    'boisson': 'Boissons',
    'champagne': 'Boissons',
    'cidre': 'Boissons',

    // Surgelés
    'surgel': 'Surgelés',
    'glace': 'Surgelés',
    'pizza': 'Surgelés',
    'frites': 'Surgelés',
    'nugget': 'Surgelés',

    // Hygiène et beauté
    'shampo': 'Hygiène et beauté',
    'savon': 'Hygiène et beauté',
    'dentifrice': 'Hygiène et beauté',
    'brosse': 'Hygiène et beauté',
    'deodorant': 'Hygiène et beauté',
    'gel': 'Hygiène et beauté',
    'coton': 'Hygiène et beauté',
    'rasoir': 'Hygiène et beauté',
    'mouchoir': 'Hygiène et beauté',
    'tampon': 'Hygiène et beauté',
    'essuie': 'Hygiène et beauté',

    // Entretien et maison
    'lessive': 'Entretien et maison',
    'eponge': 'Entretien et maison',
    'sac': 'Entretien et maison',
    'javel': 'Entretien et maison',
    'nettoyant': 'Entretien et maison',
    'adoucissant': 'Entretien et maison',
    'pastille': 'Entretien et maison',
    'sopalin': 'Entretien et maison',
    'ampoule': 'Entretien et maison',
    'pile': 'Entretien et maison',

    // Épicerie sucrée et petit-déj
    'sucre': 'Épicerie sucrée et petit-déj',
    'chocolat': 'Épicerie sucrée et petit-déj',
    'biscuit': 'Épicerie sucrée et petit-déj',
    'cereale': 'Épicerie sucrée et petit-déj',
    'confiture': 'Épicerie sucrée et petit-déj',
    'miel': 'Épicerie sucrée et petit-déj',
    'cafe': 'Épicerie sucrée et petit-déj',
    'the': 'Épicerie sucrée et petit-déj',
    'nutella': 'Épicerie sucrée et petit-déj',
    'compote': 'Épicerie sucrée et petit-déj',
    'bonbon': 'Épicerie sucrée et petit-déj',
    'muesli': 'Épicerie sucrée et petit-déj',
    'cacao': 'Épicerie sucrée et petit-déj',
    'crepe': 'Épicerie sucrée et petit-déj',
    'gaufre': 'Épicerie sucrée et petit-déj',

    // Épicerie salée
    'pate': 'Épicerie salée',
    'pates': 'Épicerie salée',
    'riz': 'Épicerie salée',
    'farine': 'Épicerie salée',
    'huile': 'Épicerie salée',
    'vinaigre': 'Épicerie salée',
    'sel': 'Épicerie salée',
    'poivre': 'Épicerie salée',
    'epice': 'Épicerie salée',
    'conserve': 'Épicerie salée',
    'sauce': 'Épicerie salée',
    'moutarde': 'Épicerie salée',
    'ketchup': 'Épicerie salée',
    'mayonnaise': 'Épicerie salée',
    'lentille': 'Épicerie salée',
    'haricot': 'Épicerie salée',
    'pois': 'Épicerie salée',
    'semoule': 'Épicerie salée',
    'quinoa': 'Épicerie salée',
    'soupe': 'Épicerie salée',
    'bouillon': 'Épicerie salée',
    'chips': 'Épicerie salée',
    'cacahuete': 'Épicerie salée',
    'olive': 'Épicerie salée',
    'cornichon': 'Épicerie salée',
    'mais': 'Épicerie salée',

    // Boulangerie et pâtisserie
    'pain': 'Boulangerie et pâtisserie',
    'baguette': 'Boulangerie et pâtisserie',
    'brioche': 'Boulangerie et pâtisserie',
    'croissant': 'Boulangerie et pâtisserie',
    'viennoiserie': 'Boulangerie et pâtisserie',
    'gateau': 'Boulangerie et pâtisserie',
    'tarte': 'Boulangerie et pâtisserie',
    'brownie': 'Boulangerie et pâtisserie',
    'muffin': 'Boulangerie et pâtisserie',
  };

  // 4. Ordre fixe des rayons (DEF)
  const DEF=[
    'Fruits et légumes',
    'Boulangerie et pâtisserie',
    'Boucherie et poissonnerie',
    'Charcuterie et traiteur',
    'Crèmerie',
    'Épicerie salée',
    'Épicerie sucrée et petit-déj',
    'Boissons',
    'Surgelés',
    'Hygiène et beauté',
    'Entretien et maison',
    'Autres'
  ];

  // 5. Classification principale
  function classify(title, appris){
    if(!title) return 'Autres';
    const t=norm(title);
    const toks=tokens(title);

    // a) Appris : titre complet normalisé
    if(appris && appris[t]) return appris[t];
    // b) Appris : premier mot
    if(appris && toks[0] && appris[toks[0]]) return appris[toks[0]];

    // c) Mot "surgel"
    if(t.includes('surgel')) return 'Surgelés';

    // d) Expressions multi-mots (le plus long match gagne)
    let bestExpr=null, bestLen=0;
    for(const [kw, aisle] of EXPR){
      const k=norm(kw);
      if(t.includes(k) && k.length > bestLen){
        bestLen=k.length;
        bestExpr=aisle;
      }
    }
    if(bestExpr) return bestExpr;

    // e) Dictionnaire mot par mot de gauche à droite (WORDS seulement, pas EXPR)
    for(const w of toks){
      // mots courts (< 4) : correspondance exacte
      if(w.length < 4){
        if(WORDS[w]) return WORDS[w];
      } else {
        // mots >= 4 : correspondance exacte d'abord, puis le plus long mot-clé qui est un préfixe du mot
        if(WORDS[w]) return WORDS[w];
        let match=null, matchLen=0;
        for(const [k, v] of Object.entries(WORDS)){
          if(w.startsWith(k) && k.length > matchLen){
            matchLen=k.length;
            match=v;
          }
        }
        if(match) return match;
      }
    }

    return 'Autres';
  }

  // 6. Apprentissage : à appeler quand l'utilisateur corrige un rayon
  function learn(title, aisle){
    const t=norm(title);
    const toks=tokens(title);
    const out={};
    out[t]=aisle;
    if(toks[0]) out[toks[0]]=aisle;
    return out;
  }

  return { classify, learn, DEF, norm, tokens };
});