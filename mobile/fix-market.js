const fs = require('fs');
let code = fs.readFileSync('App.js', 'utf8');
let lines = code.split('\n');

// Strategy: find the broken section and the old filter panel, replace all

// Lines 1332-1334 have orphaned code from partial edit
// We need to remove from after the delivery chips ScrollView to before the cuisine chips

// Find "Delivery + Filter row" comment (our partial edit inserted this)
let deliveryLine = -1;
let cuisineLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Delivery + Filter row')) deliveryLine = i;
  if (lines[i].includes('cuisines.filter') && lines[i].includes('c !==') && deliveryLine > 0 && cuisineLine < 0) {
    cuisineLine = i - 2; // The comment line before it
    break;
  }
}

console.log('Delivery line:', deliveryLine, 'Cuisine line:', cuisineLine);

if (deliveryLine > 0 && cuisineLine > 0) {
  // Fix the orphaned code: lines between deliveryLine+5 to cuisineLine-1
  // The correct delivery chips end at deliveryLine+19 (approx)
  // Let's find the actual end of the delivery+filter section
  
  let deliveryEnd = -1;
  for (let i = deliveryLine; i < cuisineLine; i++) {
    if (lines[i].includes('</View>') && deliveryEnd < 0 && i > deliveryLine + 3) {
      // The first </View> closes the filter button Pressable
      // The second </View> closes the outer View
      deliveryEnd = i + 1;
    }
  }
  
  console.log('Delivery section ends at:', deliveryEnd);
  
  if (deliveryEnd > 0) {
    // Remove everything from deliveryLine+5 (after the opening map) to cuisineLine-1 (before cuisine comment)
    const removeStart = deliveryLine + 5; // after the map lambda opens
    const removeEnd = cuisineLine - 1;
    
    console.log('Removing lines', removeStart, 'to', removeEnd);
    lines.splice(removeStart, removeEnd - removeStart + 1);
    
    fs.writeFileSync('App.js', lines.join('\n'));
    console.log('Fixed!');
  } else {
    console.log('Could not find delivery end');
  }
} else {
  console.log('Could not find markers');
}
