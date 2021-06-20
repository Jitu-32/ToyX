(function (window, document) {

    var i;

    var rtMan = {

        socket: null,
        username: null,
        roomname: null,
        gameType: null,

        createSocket: function () {

            rtMan.socket = io();

            console.log("TEST_DEBUG: ", window.roomData);
            rtMan.username = window.roomData.username
            rtMan.roomname = window.roomData.roomname
            rtMan.gameType = window.roomData.gameType

            rtMan.socket.on('drawing', function (data) {

                // not syncing drawing with all!
                // rtMan.drawFromSocket(data.boardData);

            });

            rtMan.socket.on('chatMsg', function (data) {
                $(".chatBody").html($(".chatBody").html() + '<div class="chatMsgContainer">' + data.from + ' : ' + data.msg + '</div>');
                chat.autoScroll();

                //if chat window is minimized
                if (!chat.status) {
                    $("#chatNotifier").css("visibility", "visible");
                    $("#chatNotifier").css("top", parseInt($(".chatWidget").css("top")) - 10);
                    $("#chatNotifier").css("left", parseInt($(".chatWidget").css("left")) - 10);
                }

            });

            rtMan.socket.on('joinConfirmed', function (data) {

                console.log("boardData:", data.data.boardData);

                for (i = data.data.boardData.length - 1; i >= 0; i--) {
                    rtMan.drawFromSocket(data.data.boardData[i]);
                }

                for (i = data.data.messages.length - 1; i >= 0; i--) {
                    $(".chatBody").html($(".chatBody").html() + '<div class="chatMsgContainer">' + data.data.messages[i].from + " : " + data.data.messages[i].msg + '</div>');
                }

                chat.members = data.members;
                $("#chatMembers").text("Chat : " + chat.members.length);

                rtMan.socket.emit("isPlayerReady", thisUserReady);
            });

            rtMan.socket.on('left', function (data) {
                chat.members = data;
                $("#chatMembers").text("Chat : " + chat.members.length);
            });

            rtMan.socket.on('startVoting', function (solutions) {
                console.log("show overlay!; show solutions:", solutions);
                $(".VotingWidget").get()[0].style.display = "block";
                $(".ProgressCircle").hide();
                $(".VoteItemContainer").show();

                let voteItemContainer = $(".VoteItemContainer").get()[0];
                solutions.forEach(aSolution => {
                    let imgElm = document.createElement("img");
                    imgElm.setAttribute("src", aSolution['imageUrl']);
                    imgElm.style.height = "100";
                    imgElm.style.width = "100%";
                    imgElm.alt = "solution";

                    let usernameElm = document.createElement("p");
                    usernameElm.innerText = aSolution['username'];

                    let voteItem = document.createElement("div");
                    voteItem.setAttribute("class", "card VoteItem");

                    voteItem.appendChild(imgElm);
                    voteItem.appendChild(usernameElm);
                    voteItem.onclick = function (ev) {
                        rtMan.socket.emit("votedSolution", {
                            username: aSolution['username'],
                        });
                        $(".VoteItemContainer").hide();
                    };

                    voteItemContainer.appendChild(voteItem);
                });

            });

            rtMan.socket.on('timeRemaining', function (seconds) {
                // console.log('timeRemaining :', seconds);
                $('#roundFinishingTime').html("Time remaining: " + seconds + " seconds");
                if (seconds == 0) {
                    // disable drawing now and send the solution!
                    $(".VotingWidget").get()[0].style.display = "block";
                    $(".ProgressCircle").show();
                    $(".VoteItemContainer").hide();
                    let thisSolution = {
                        username: rtMan.username,
                        imageUrl: $("#canvas").get()[0].toDataURL(),
                    };
                    console.log("solution emitted by this user:", thisSolution);
                    rtMan.socket.emit("solution", thisSolution);
                }
            });

            rtMan.socket.on('updatePlayersList', function (allPlayersReadyList) {
                console.log("updatePlayersList:", allPlayersReadyList);

                //refreshing all playerslist
                let playersJoinedList = $("#playersJoinedList").get()[0];
                playersJoinedList.replaceChildren();

                let allReady = true;
                for (let i = 0; i < allPlayersReadyList.length; ++i) {
                    let username = allPlayersReadyList[i][0];
                    let isReady = allPlayersReadyList[i][1];

                    console.log("issue:", username, isReady);
                    let playerElm = document.createElement("p");
                    let isready_str = isReady ? "ready" : "not ready";
                    playerElm.innerText = username + " is " + isready_str;
                    playerElm.style.color = "#FFF";
                    playersJoinedList.appendChild(playerElm);

                    allReady = allReady && isReady;
                }
                if (!allReady) {
                    $('#lobbyWaitingTime').html("");
                }
            });

            let thisUserReady = false;
            $("#startRoundButton").on("click", function () {
                // emit I am ready!
                thisUserReady = !thisUserReady;
                rtMan.socket.emit("isPlayerReady", thisUserReady);

                if (thisUserReady)
                    $("#startRoundButton").html("I'm Not Ready!");
                else
                    $("#startRoundButton").html("I'm Ready!");
            });

            $("#backToLoginButton").on('click', function () {
                // go back to login page
                window.allowGoBack = true;
                window.location.href = "/battleground";
            })


            rtMan.socket.on('roundStartTimeRemaining', function (seconds) {
                $('#lobbyWaitingTime').html("Starting in " + seconds);
            });

            rtMan.socket.on('startRound', function (data) {
                $('.LobbyWidget').hide();
                console.log("startRound: " + JSON.stringify(data));
                //todo: display problem statement in problem statement area!
                $('#problemStatement').text("title: " + data.problemStatement.title + "\ndesc: " + data.problemStatement.desc)
            })

            rtMan.socket.on('roundResults', function (roundResults) {
                $('.VotingWidget').hide();
                $('.ResultsWidget').show();
                console.log("roundResults: ", roundResults);

                let resultItemContainer = $(".ResultItemContainer").get()[0];
                roundResults.forEach((aResult, i) => {
                    let h2Elm = document.createElement("h2");
                    h2Elm.innerText = "#" + (i + 1) + ":    " + aResult.username + " got " + aResult.votes + " vote(s)";
                    h2Elm.setAttribute("class", "card ResultItem");

                    resultItemContainer.appendChild(h2Elm);
                });

            })

        },

        drawFromSocket: function (data) {

            var initialLineWidth = board.ctx.lineWidth;
            var initialStrokeStyle = board.ctx.strokeStyle;
            var initialFont = board.ctx.font;

            console.log(data);

            // console.log(data);
            var socketData = data.data;



            //for clear, undo
            if (socketData) {
                board.ctx.lineWidth = socketData.lineWidth;
                board.ctx.strokeStyle = socketData.strokeStyle;
                board.ctx.fillStyle = socketData.strokeStyle;
                board.ctx.font = socketData.font || '';
            }

            switch (data.type) {

                case 'line':
                    board.drawer.line(board.ctx, socketData.x1, socketData.y1, socketData.x2, socketData.y2);
                    break;

                case 'rectangle':
                    board.drawer.rect(board.ctx, socketData.x, socketData.y, socketData.w, socketData.h);
                    break;

                case 'ellipse':
                    board.drawer.ellipse(board.ctx, socketData.x, socketData.y, socketData.w, socketData.h);
                    break;

                case 'triangle':
                    board.drawer.triangle(board.ctx, socketData.x, socketData.y, socketData.w, socketData.h);
                    break;

                case 'star':
                    board.drawer.star(board.ctx, socketData.x, socketData.y, socketData.w, socketData.h);
                    break;

                case 'moon':
                    board.drawer.moon(board.ctx, socketData.x, socketData.y, socketData.w, socketData.h);
                    break;

                case 'love':
                    board.drawer.love(board.ctx, socketData.x, socketData.y, socketData.w, socketData.h);
                    break;

                case 'circle':
                    board.drawer.circle(board.ctx, socketData.x1, socketData.y1, socketData.x2, socketData.y2);
                    break;

                case 'arrow':
                    board.drawer.arrow(board.ctx, socketData.x1, socketData.y1, socketData.x2, socketData.y2);
                    break;

                case 'face':
                    board.drawer.face(board.ctx, socketData.x1, socketData.y1, socketData.x2, socketData.y2);
                    break;

                case 'text':
                    board.drawer.text(board.ctx, socketData.text, socketData.x, socketData.y);
                    break;

                case 'pencil':
                    for (i = socketData.points.length - 2; i >= 0; i--) {
                        board.drawer.pencil(board.ctx, socketData.points[i].x, socketData.points[i].y, socketData.points[i + 1].x, socketData.points[i + 1].y);
                    }
                    break;

                case 'marker':
                    for (i = socketData.points.length - 2; i >= 0; i--) {
                        board.drawer.marker(board.ctx, socketData.points[i].x, socketData.points[i].y, socketData.points[i + 1].x, socketData.points[i + 1].y, socketData.size, socketData.strokeStyle);
                    }
                    break;

                case 'chalk':
                    for (i = socketData.points.length - 2; i >= 0; i--) {
                        board.drawer.chalk(board.ctx, socketData.points[i].x, socketData.points[i].y, socketData.points[i + 1].x, socketData.points[i + 1].y, socketData.size);
                    }
                    break;

                case 'spray':
                    for (i = socketData.points.length - 2; i >= 0; i--) {
                        board.drawer.spray(board.ctx, socketData.points[i].x, socketData.points[i].y, socketData.size);
                    }
                    break;

                case 'doubleBrush':
                    for (i = socketData.points.length - 2; i >= 0; i--) {
                        board.drawer.doubleBrush(board.ctx, socketData.points[i].x, socketData.points[i].y, socketData.points[i + 1].x, socketData.points[i + 1].y, socketData.offset);
                    }
                    break;

                case 'circleBrush':
                    for (i = socketData.points.length - 2; i >= 0; i--) {
                        board.drawer.circleBrush(board.ctx, socketData.points[i].x, socketData.points[i].y, socketData.points[i + 1].x, socketData.points[i + 1].y);
                    }
                    break;

                case 'eraser':
                    for (i = socketData.points.length - 1; i >= 0; i--) {
                        board.ctx.beginPath();
                        board.ctx.fillStyle = $("#canvas").css('background-color');
                        board.ctx.arc(socketData.points[i].x, socketData.points[i].y, socketData.size, 0, 2 * Math.PI);
                        board.ctx.fill();
                    }
                    break;

                case 'clear':
                    board.drawer.clear(board.ctx);
                    board.drawer.clear(board.lctx);
                    break;

                default:
                    break;
            }


            //reset context linewidth and stokeStyle
            board.ctx.strokeStyle = initialStrokeStyle;
            board.ctx.fillStyle = initialStrokeStyle;
            board.ctx.lineWidth = initialLineWidth;
            board.ctx.font = initialFont;

        }
    }

    window.rtMan = rtMan;

}(window, document));