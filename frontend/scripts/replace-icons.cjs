const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'pages');

const iconMap = {
  '🍽️': { icon: 'UtensilsCrossed', size: 'w-8 h-8', color: 'text-white' },
  '🍳': { icon: 'CookingPot', size: 'w-5 h-5', color: 'text-white' },
  '🛒': { icon: 'ShoppingCart', size: 'w-4 h-4', color: '' },
  '📦': { icon: 'Package', size: 'w-4 h-4', color: '' },
  '📊': { icon: 'LayoutDashboard', size: 'w-4 h-4', color: '' },
  '📋': { icon: 'ClipboardList', size: 'w-4 h-4', color: '' },
  '👤': { icon: 'User', size: 'w-4 h-4', color: '' },
  '🔍': { icon: 'Search', size: 'w-4 h-4', color: '' },
  '📅': { icon: 'Calendar', size: 'w-4 h-4', color: '' },
  '📭': { icon: 'Inbox', size: 'w-8 h-8', color: 'text-stone-300' },
  '⭐': { icon: 'Star', size: 'w-4 h-4', color: '' },
  '🕐': { icon: 'Clock', size: 'w-3 h-3', color: '' },
  '⚠️': { icon: 'AlertTriangle', size: 'w-4 h-4', color: '' },
  '✨': { icon: 'Sparkles', size: 'w-4 h-4', color: '' },
  '⏳': { icon: 'Hourglass', size: 'w-4 h-4', color: '' },
  '🔄': { icon: 'RefreshCw', size: 'w-3 h-3', color: '' },
  '💵': { icon: 'Banknote', size: 'w-4 h-4', color: '' },
  '💳': { icon: 'CreditCard', size: 'w-4 h-4', color: '' },
  '📧': { icon: 'Mail', size: 'w-4 h-4', color: '' },
  '📝': { icon: 'FileText', size: 'w-4 h-4', color: '' },
  '❌': { icon: 'X', size: 'w-4 h-4', color: '' },
  '✅': { icon: 'Check', size: 'w-4 h-4', color: '' },
  '🎉': { icon: 'PartyPopper', size: 'w-4 h-4', color: '' },
};

const imports = {};
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  let changed = false;

  for (const [emoji, info] of Object.entries(iconMap)) {
    if (content.includes(emoji)) {
      const iconTag = `<${info.icon} className="${info.size} ${info.color}" />`;
      content = content.split(emoji).join(iconTag);
      imports[info.icon] = true;
      changed = true;
    }
  }

  if (changed && Object.keys(imports).length > 0) {
    const importLine = `import { ${Object.keys(imports).join(', ')} } from 'lucide-react';`;
    if (!content.includes('lucide-react')) {
      content = content.replace("import { useTranslation }", `${importLine}\nimport { useTranslation }`);
      if (!content.includes('lucide-react')) {
        content = `${importLine}\n${content}`;
      }
    }
    fs.writeFileSync(fp, content);
    console.log('OK', file);
  }
}
console.log('Done');
