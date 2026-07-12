const fs = require('fs');
const path = require('path');
const d = path.join(__dirname, '..', 'src', 'pages');
const map = {
  'MemberMarketplacePage.jsx': [
    ['📅 Date<', '📅 {t(\'marketplace.date\')}<'],
    ['🔍 Search<', '🔍 {t(\'marketplace.search\')}<'],
    ['Search menus, cooks, or items...', '{t(\'marketplace.searchPlaceholder\')}'],
    ['Active<', '{t(\'marketplace.active\')}<'],
    ['Menu items<', '{t(\'marketplace.menuItems\')}<'],
    ['No items listed', '{t(\'marketplace.noItems\')}'],
    ['`+${menu.items.length - 3} more items`', 't(\'marketplace.moreItems\', { count: menu.items.length - 3 })'],
    ['Until ', '{t(\'marketplace.until\')} '],
    ['View & Order →', '{t(\'marketplace.viewAndOrder\')}'],
    ['sold<', '{t(\'marketplace.sold\')}<'],
    ['left<', '{t(\'marketplace.left\')}<'],
  ],
  'MemberOrdersPage.jsx': [
    ['📦 My Orders<', '📦 {t(\'orders.title\')}<'],
    ['Back to Shopping<', '{t(\'orders.backToShopping\')}<'],
    ['Filter by Status<', '{t(\'orders.filterByStatus\')}<'],
    ['Items<', '{t(\'orders.items\')}<'],
    ['No items found', '{t(\'orders.noItemsFound\')}'],
    ['from ', '{t(\'orders.orderFrom\')} '],
    ['Browse Menus', '{t(\'marketplace.browseMenus\')}'],
  ],
  'CookDashboardPage.jsx': [
    ['Active Menus<', '{t(\'cook.activeMenus\')}<'],
    ['Total Orders<', '{t(\'cook.totalOrders\')}<'],
    ['Pending<', '{t(\'cook.pendingOrders\')}<'],
    ['Revenue<', '{t(\'cook.revenue\')}<'],
    ['Manage →', '{t(\'cook.manage\')}'],
    ['View →', '{t(\'cook.view\')}'],
    ['Need attention', '{t(\'cook.needAttention\')}'],
    ['All time', '{t(\'cook.allTime\')}'],
    ['Quick Actions<', '{t(\'cook.quickActions\')}<'],
    ['+ Create New Menu', '{t(\'cook.createMenu\')}'],
    ['View All Orders', '{t(\'cook.viewAllOrders\')}'],
  ],
  'CookMenusPage.jsx': [
    ['📋 My Menus<', '📋 {t(\'cook.myMenus\')}<'],
    ['Cancel<', '{t(\'cook.cancel\')}<'],
    ['+ Create Menu<', '{t(\'cook.createMenuBtn\')}<'],
    ['Create New Menu<', '{t(\'cook.createNewMenu\')}<'],
    ['Menu Title *<', '{t(\'cook.menuTitle\')}<'],
    ['Description<', '{t(\'cook.description\')}<'],
    ['Menu Date *<', '{t(\'cook.menuDate\')}<'],
    ['Order Start *<', '{t(\'cook.orderStart\')}<'],
    ['Order End *<', '{t(\'cook.orderEnd\')}<'],
    ['Pickup Location *<', '{t(\'cook.pickupLocation\')}<'],
    ['Pickup Available<', '{t(\'cook.pickupAvailable\')}<'],
    ['Delivery Available<', '{t(\'cook.deliveryAvailable\')}<'],
    ['Create Menu<', '{t(\'cook.createMenuSubmit\')}<'],
    ['No menus yet. Create your first menu!', '{t(\'cook.noMenusYet\')}'],
    ['View Details<', '{t(\'cook.viewDetails\')}<'],
    ['Publish<', '{t(\'cook.publish\')}<'],
  ],
  'CookOrdersPage.jsx': [
    ['📋 Orders<', '📋 {t(\'cook.ordersTitle\')}<'],
    ['Back to Dashboard<', '{t(\'cook.backToDashboard\')}<'],
    ['🔄 Refresh Now', '🔄 {t(\'cook.refreshNow\')}'],
    ['No orders yet', '{t(\'cook.noOrdersYet\')}'],
    ['Items to Prepare:<', '{t(\'cook.itemsToPrepare\')}<'],
    ['Delivery Type:<', '{t(\'cook.deliveryTypeLabel\')}<'],
    ['Total Amount:<', '{t(\'cook.totalAmount\')}<'],
    ['Special Requests:<', '{t(\'cook.specialRequests\')}<'],
    ['Tap to view and confirm this order', '{t(\'cook.tapToConfirm\')}'],
    ['Order confirmed. Start preparing!', '{t(\'cook.orderConfirmed\')}'],
    ['Ready for pickup/delivery', '{t(\'cook.readyForPickupCook\')}'],
  ],
  'CookOrderDetailPage.jsx': [
    ['Back to Orders<', '← {t(\'orders.backToOrders\')}<'],
    ['Actions<', '{t(\'cook.actions\')}<'],
    ['Order Total<', '{t(\'cook.orderTotal\')}<'],
    ['Update Order Status<', '{t(\'cook.updateStatus\')}<'],
    ['Mark as ', '{t(\'cook.markAs\')} '],
    ['Confirm this order to start preparing it', '{t(\'cook.confirmPrompt\')}'],
    ['Mark as ready when the order is ready for pickup/delivery', '{t(\'cook.readyPrompt\')}'],
    ['Order is ready! Customer can pickup now', '{t(\'cook.readyDonePrompt\')}'],
  ],
};
for (const [f, reps] of Object.entries(map)) {
  const fp = path.join(d, f);
  if (!fs.existsSync(fp)) { console.log('SKIP', f); continue; }
  let c = fs.readFileSync(fp, 'utf8');
  let n = 0;
  for (const [old, neo] of reps) {
    if (c.includes(old)) { c = c.split(old).join(neo); n++; }
  }
  fs.writeFileSync(fp, c);
  console.log('OK', f, n + '/' + reps.length);
}
console.log('Done');
