function doGet(e) {
  var x = HtmlService.createTemplateFromFile("index");
  var y = x.evaluate();
  var z = y.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return z;
}

function login(username, password) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Arkusz1');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === password) {
      return {
        username: data[i][0],
        avatar: data[i][2] || '',
        points: data[i][3]
      };
    }
  }
  return null;
}
function createGroup(groupName, groupImageUrl, creator) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Groups');
  sheet.appendRow([groupName, groupImageUrl, new Date(), creator]);
}

function addNotificationToGroupMembers(groupName, username, content) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Groups');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === groupName) {
      var members = data[i][4] ? data[i][4].split(", ") : [];
      var creator = data[i][3];
      members.push(creator); // Dodaj założyciela do listy członków
      
      var notificationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Notifications');
      
      members.forEach(function(member) {
        if (member !== username) { // Nie dodawaj powiadomienia dla autora posta
          notificationSheet.appendRow([member, groupName, content, new Date()]);
        }
      });
    }
  }
}


function getUserNotifications(username) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Notifications');
  var data = sheet.getDataRange().getValues();
  var notifications = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      notifications.push({
        group: data[i][1],
        content: data[i][2],
        time: formatTimeDifference(new Date(data[i][3]))
      });
    }
  }
  return notifications;
}

function clearUserNotifications(username) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Notifications');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === username) {
      sheet.deleteRow(i + 1);
    }
  }
}


function addPostToGroup(groupName, username, content) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GroupPosts');
  sheet.appendRow([groupName, username, content, new Date()]);
  addNotificationToGroupMembers(groupName, username, content);
}

function getGroupPosts(groupName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GroupPosts');
  var data = sheet.getDataRange().getValues();
  var posts = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === groupName) {
      var post = {
        id: i, // ID posta do identyfikacji przy dodawaniu reakcji
        username: data[i][1],
        content: data[i][2],
        time: formatTimeDifference(new Date(data[i][3])),
        reactions: {
          '😂': data[i][4] ? data[i][4].split(', ') : [],
          '😎': data[i][5] ? data[i][5].split(', ') : [],
          '😍': data[i][6] ? data[i][6].split(', ') : [],
          '😥': data[i][7] ? data[i][7].split(', ') : []
        }
      };
      posts.push(post);
    }
  }
  return posts;
}

function addReactionToPost(groupName, postId, emoji, username) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GroupPosts');
  var row = sheet.getRange(postId + 1, 1, 1, sheet.getLastColumn()).getValues()[0]; // Pobierz wiersz z postem

  var emojiColumnIndex = {'😂': 5, '😎': 6, '😍': 7, '😥': 8}[emoji];
  var currentReactions = row[emojiColumnIndex - 1];
  
  if (!currentReactions) {
    currentReactions = [];
  } else {
    currentReactions = currentReactions.split(', ');
  }

  if (currentReactions.indexOf(username) === -1) {
    currentReactions.push(username);
    sheet.getRange(postId + 1, emojiColumnIndex).setValue(currentReactions.join(', '));
  }
}


function getGroups() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Groups');
  var data = sheet.getDataRange().getValues();
  var groups = [];
  for (var i = 1; i < data.length; i++) {
    var members = data[i][4] ? data[i][4].split(", ") : [];
    members.push(data[i][3]); // Dodaj założyciela do listy członków
    var group = {
      name: data[i][0],
      imageUrl: data[i][1],
      members: members, // Przechowuj listę członków wraz z założycielem
      owner: data[i][3], // Dodaj właściciela grupy
      admins: data[i][3], // Dodaj właściciela grupy
    };
    groups.push(group);
  }
  return groups;
}




function formatTimeDifference(postTime) {
  var timeDifference = Math.floor((new Date() - postTime) / (1000 * 60)); // Obliczamy różnicę w minutach
  if (timeDifference < 60) {
    return timeDifference + " minutes ago"; // Zwracamy informację o czasie w minutach
  } else {
    var hours = Math.floor(timeDifference / 60);
    return hours + " hours ago"; // Zwracamy informację o czasie w godzinach
  }
}
function isUserInGroup(groupName, username) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Groups');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === groupName) {
      var creator = data[i][3]; 
      var members = data[i][4] ? data[i][4].split(", ") : []; 
      return creator === username || members.includes(username);
    }
  }
  return false;
}



function joinGroup(groupName, username) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Groups');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === groupName) {
      if (!data[i][4]) {
        sheet.getRange(i + 1, 5).setValue(username); // Kolumna E (piąta kolumna)
      } else {
        var members = data[i][4].split(", ");
        if (members.indexOf(username) === -1) {
          members.push(username);
          sheet.getRange(i + 1, 5).setValue(members.join(", "));
        }
      }
      return;
    }
  }
}
function isAccountClosed(username) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Arkusz1');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) { // Assuming username is in column A
      return data[i][4] === "🚫"; // Column E corresponds to index 4
    }
  }
  return false;
}





