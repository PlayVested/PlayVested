function toggleMenuItem(menuItemID) {
    const group = document.getElementById(menuItemID);
    if (group) {
        group.hidden = !group.hidden;
    }
}
