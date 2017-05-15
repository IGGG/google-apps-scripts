function hunt() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  /* Load Spread Sheet */  
  var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
  var names = sheet.getRange(1, 1, prop.ROW_NUM, 2).getValues();
  
  Logger.log(names);
  var unuseNames = names.filter(
    function(row){
      return row[1] == 0;
    });
  Logger.log(unuseNames);
  var row_num = Math.floor(Math.random() * unuseNames.length);
  var text = 'not found unusing name.';
  if (unuseNames.length > 0) {
    text = unuseNames[row_num][0];
    updateSheet(sheet, names, text, prop);
  }
}

function updateSheet(sheet, names, name, prop) {
  var date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/M/d/');
  for (var i = 0; i < names.length; i++) {
    if (names[i][0] == name) {
      sheet.getRange(i+1, 2).setValue(1);
      sheet.getRange(i+1, 3).setValue(date);
      SpreadsheetApp.getActiveSheet().setActiveSelection("A" + (i+1));
      return true;
    }
  }
  return false;
}
