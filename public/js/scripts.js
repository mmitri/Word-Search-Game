const SERVER = "http://ganymede.cse.lehigh.edu:4041";
let myId = 0;
let myUsername = 0;
let usernameSent = 0;
let tableLoaded = false;
let socket;

$(document).ready(function(){
  socket = io.connect(SERVER);
  console.log("Starting the game...");
  gameEvents();
  socket.on("players", function(players){
    console.log("Updating the players...");
    loadPlayers(players);
  });
  socket.on("gridupdates", function(grid){
    console.log("Updating the grid...");
    loadGridUpdates(grid);
  });
  socket.on("chatbroadcast", function(chatMsg){
    $("#chatMessages").append("<p>" + chatMsg.msg + "</p>");
  });
});

/***
 * To send a message to the server, use a line like this:
 * socket.emit(event, msg);
 * where event is a string with the name of the event being used to send the message. Msg is a value (normally an object) that will be sent to the server.
 */
function send(event, msg) {
  socket.emit(event, msg);
}

/***
 * To receive messages from the server, set up an event handler using code similar to this:
 * socket.on(event, function (msg) {
 * // code to handle the message
 * });
 * where event is a string with the name of the event being handled and msg is the message that was sent from the server.
 */

function gameEvents(){
  // Sending the player's name event handler
  $('#sendUsername').click(function (){
    if(usernameSent == 0){
      let username = $("#username").val();
      console.log("Sending username: ", username);
      let login = {}; login.username = username;
      send("login", login);
      socket.on("login", function(res){
        if(res.success){
          $("#username").val("");
          usernameSent = 1;
          myId = res.id;
          myUsername = res.username;
          console.log("Your id is: " + myId);
          console.log("Your username is: " + myUsername);
          loadPuzzle();
        }else{
          console.log("Login is a FAILURE ;(");
        }
      });
    }else{
      return;
    }
  });

  // Sending the word event handler
  $('#sendWord').click(function (){
    let wordList = [];
    $('#wordSearchTable td.selected').each(function(index, cell){
      let col = $(cell).closest("td").index(); // gives the column coordinate
      let row = $(cell).closest("tr").index(); // gives the row coordinate
      wordList.push({r: row, c: col});
    });
    console.log("Selected word: " + JSON.stringify(wordList));
    let submit = {}; submit.id = myId; submit.letters = wordList;
    send("submit", submit);
    $('#wordSearchTable td.selected').toggleClass("selected");
    socket.on("submit", function(res){
      if(res.success){
        console.log("Successfully send word");
        console.log(JSON.stringify(res));
      }else{
        console.log("Sending word failure ;(");
        console.log(JSON.stringify(res));
      }
    });
  });

  // Sending a chat message event handler
  $('#sendMessage').click(function (){
    let message = $("#messageBox").val();
    console.log("Chat message: " + message);
    let chat = {}; chat.id = myId; chat.msg = message;
    $("#messageBox").val("");
    send("chatsend", chat);
  });
}

function loadPuzzle(){
  let puzzle = {}; puzzle.id = myId;
  send("puzzle", puzzle);
  socket.on("puzzle", function(res){
    if(res.success){
      console.log("LoadingPuzzle is a SUCCESS!");
      let puzzleTheme = res.theme;
      let nrows = res.nrows;
      let ncols = res.ncols;
      let grid = res.grid;
      loadThemeandGrid(puzzleTheme, nrows, ncols, grid);
    }else{
      console.log("LoadPuzzle is a FAILURE ;(");
    }
  });
}

function loadPlayers(players){
  let leaderboard = "";
  players.sort((a,b) => { return b.score - a.score;});
  for(let i = 0; i < players.length; ++i){
    let player = players[i];
    let row = "<tr style=background-color: #ffd700>" + (player.winner) +
      "<td>" + player.name + "</td>" + 
      "<td>" + player.score + "</td>" +
      "</tr>";
    leaderboard += row;
  }
  $('#leaderboard').html(leaderboard);
}

function loadThemeandGrid(puzzleTheme, nrows, ncols, grid){
  console.log("Loading Theme and Grid...");
  // create local varibles to hold the getPuzzle results
  let theme = puzzleTheme; let numRows = nrows;
  let numCols = ncols; let gridS = grid; let cellIndex = 0;
  $('#wordSearchTable').empty(); // empty the word search table
  $('#wordSearchTopic').text(theme); // set the word search topic
  // create the word search table
  for(let i=0; i<numRows; ++i){
    let row = $("<tr></tr>");
    for(let j=0; j<numCols; ++j){
      let cell = $("<td></td");
      $(cell).text(gridS.charAt(cellIndex));
      $(row).append(cell);
      cellIndex++;
    }
    $('#wordSearchTable').append(row);
  }
  $('#wordSearchTable td').click(selectLetter);
  tableLoaded = true;
}

function selectLetter(event){
  $(event.target).toggleClass("selected");
}

function loadGridUpdates(data){
  if(!tableLoaded) return;
  let table = $('#wordSearchTable')[0];
  data.words.forEach((word) => {
    word.letters.forEach((pair) => {
      let cell = table.rows[pair.r].cells[pair.c];
      $(cell).css("background-color", word.color);
      if(isDark(word.color)){
        $(cell).css("color", "white");
      } else {
        $(cell).css("color", "black");
      }
    });
  });
}

// Returns true if color is dark enough to set the text color to white
function isDark(color) {
  const c = color.substring(1);  // strip #
  const rgb = parseInt(c, 16);   // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff;  // extract red
  const g = (rgb >>  8) & 0xff;  // extract green
  const b = (rgb >>  0) & 0xff;  // extract blue
  var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma < 128;
}