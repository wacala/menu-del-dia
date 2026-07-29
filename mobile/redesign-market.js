const fs = require('fs');
let code = fs.readFileSync('App.js', 'utf8');
const lines = code.split('\n');

// Find the market view FlatList ListHeaderComponent start
// We want to replace everything from "Sort button" comment to the closing of the filter panel
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  // Find the Sort button line
  if (lines[i].includes('Sort button') && lines[i].includes('{/*')) {
    startIdx = i - 1; // the parent View before Sort button
  }
  // Find where the Cuisine scrollable chips section is defined (not the inline one in filters)
  // This is the first "cuisines.filter" after the market view
  if (lines[i].includes('Cuisine scrollable chips') && startIdx > 0 && endIdx < 0) {
    endIdx = i - 1; // end before the cuisine chips section
  }
}

if (startIdx < 0 || endIdx < 0) {
  console.log('ERROR: Could not find markers. start:', startIdx, 'end:', endIdx);
  // Try alternative markers
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Sort button') && startIdx < 0) startIdx = i - 1;
    if (lines[i].includes('cuisines.filter') && lines[i].includes('c !==') && startIdx > 0 && endIdx < 0 && lines[i].includes('.map((c)')) {
      endIdx = i - 3;
      break;
    }
  }
  console.log('Retry: start:', startIdx, 'end:', endIdx);
}

if (startIdx < 0 || endIdx < 0) {
  console.log('FAILED');
  process.exit(1);
}

console.log('Removing lines', startIdx, 'to', endIdx, '—', lines[startIdx].trim(), '...', lines[endIdx].trim());

// Remove old filter panel
const removed = lines.splice(startIdx, endIdx - startIdx + 1);
console.log('Removed', removed.length, 'lines');

// Insert new compact design
const newHeader = [
  "      {/* Delivery + Filter row */}",
  "      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' }}>",
  "        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>",
  "          {['all', 'pickup', 'delivery'].map((d) => {",
  "            const active = filterDelivery === d;",
  "            return (",
  "              <Pressable key={d} onPress={() => setFilterDelivery(d)}",
  "                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,",
  "                  backgroundColor: active ? T.primary : T.card,",
  "                  borderWidth: 1, borderColor: active ? T.primary : T.border }}>",
  "                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : T.text }}>",
  "                  {d === 'all' ? _t('search.allDelivery') : d === 'pickup' ? _t('search.pickup') : _t('search.delivery')}",
  "                </Text>",
  "              </Pressable>",
  "            );",
  "          })}",
  "        </ScrollView>",
  "        <Pressable onPress={() => setShowFilterModal(true)}",
  "          style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: T.border,",
  "            backgroundColor: T.card, justifyContent: 'center', alignItems: 'center' }}",
  "        >",
  "          <Ionicons name='options-outline' size={18} color={T.text} />",
  "        </Pressable>",
  "      </View>",
];

lines.splice(startIdx, 0, ...newHeader);
fs.writeFileSync('App.js', lines.join('\n'));
console.log('Done! Inserted', newHeader.length, 'lines');
