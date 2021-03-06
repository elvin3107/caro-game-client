import React,{ useState, useEffect} from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import {Card, CardContent, Grid, Link, Button,Paper, Box, CardHeader, CardActions} from '@material-ui/core';
import swal from 'sweetalert';
import CaroGame from './CaroGame';
import MessageRoom from '../components/MessageRoom';
import CountDown from './CountDown';
import { RoomOutlined } from '@material-ui/icons';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

import loading from "./loading.svg"

//setting dialog styles
const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

const DialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
      <MuiDialogTitle disableTypography className={classes.root} {...other}>
        <Typography variant="h6">{children}</Typography>
        {onClose ? (
          <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
  });
  
  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2),
    },
  }))(MuiDialogContent);
  
  const DialogActions = withStyles((theme) => ({
    root: {
      margin: 0,
      padding: theme.spacing(1),
    },
  }))(MuiDialogActions);

//function room
export default function Room(props) {    
    const curUser = JSON.parse(localStorage.getItem('curUser'));
    const socket = props.socket;
    const roomID = useParams().id;
    const [isLeaving, setIsLeaving] = useState(false);
    const [openInviteDialog, setOpenInviteDialog] = useState(false);
    const [usersOnline, setUsersOnline] = useState([]);

    const [room, setRoom] = useState({
        roomId: null,
        hostName: null,
        status: null,
        nextTurn: 1,
        type: "",
        password: "",
        timePerRound: "50",
        player1: {
            id: null,
            name: null
        },
        player2: {
            id: null,
            name: null
        },
        curGame: null,
        chat: [],
    });
    const [isEndGame, setIsEndGame] = useState(true);
    const [duration, setDuration] = useState(parseInt(room.timePerRound));
    const [changeKey, setChangeKey] = useState(1);

    useEffect(()=>{
        socket.on('roomJoined',  response => {setRoom(response)});
        socket.on('roomUpdated', response => {setRoom(response)});
        socket.on('gameResult', response => showGameResult(response));
        socket.on('updateUsersOnlineList', (response) => setUsersOnline(response)); 
        socket.on('setTimer', response => { setDuration(parseInt(response.duration)); setChangeKey(changeKey + 1); });
        socket.on('getDrawRequest', response => handleGetDrawRequest(response));
        socket.on('answerDrawRequest', response => handleAnswerDrawRequest(response));
    }, [room]);

    const joinPlayer = (position) =>{
        if(position === 1 && room.player2.id !== curUser._id)
        {
            socket.emit("updateRoom", {
                ...room,
                player1: {
                    id: curUser._id,
                    name: curUser.name
                }
            }); 
        }
        else if (position === 1 && room.player2.id === curUser._id)
        {
            socket.emit("updateRoom", {
                ...room,
                player1: {
                    id: curUser._id,
                    name: curUser.name
                },
                player2: {
                    id: null,
                    name: null
                }
            }); 
        }
        else if (position === 2 && room.player1.id !== curUser._id)
        {
            socket.emit("updateRoom", {
                ...room,
                player2: {
                    id: curUser._id,
                    name: curUser.name
                }
            }); 
        }
        else if (position === 2 && room.player1.id === curUser._id)
        {
            socket.emit("updateRoom", {
                ...room,
                player1: {
                    id: null,
                    name: null
                },
                player2: {
                    id: curUser._id,
                    name: curUser.name
                }
            }); 
        }
    }

    const leavePlayer = () => {
        if(room.player1.id === curUser._id)
        {
            socket.emit("updateRoom", {
                ...room,
                player1: {
                    id: null,
                    name: null
                }
            });
        }
        if(room.player2.id === curUser._id)
        {
            socket.emit("updateRoom", {
                ...room,
                player2: {
                    id: null,
                    name: null
                }
            });
        }
    };

    const handleLeaveRoom = () => {
        console.log('from leave room', room);
        if(room.status === 1 && (curUser._id === room.player1.id || curUser._id === room.player2.id)) {
            swal({
                title: "B???n c?? ch???c tho??t trong khi ??ang ch??i ?",
                text: "B???n s??? b??? s??? thua n???u tho??t tr???n",
                icon: "warning",
                buttons: {
                    confirm: {
                        text: "X??c nh???n",
                        value: "confirm"
                    },
                    cancel: "Kh??ng"
                },
            })
            .then((value) => {
                if(value === "confirm") {
                    socket.emit("gameResult", {
                        room: {
                            ...room,
                            status: 0
                        },
                        winner: curUser._id === room.player1.id ? 2 : 1,
                        resultType: "winLose" // C??n 1 type n???a l?? "draw"
                    });
                    socket.emit("leaveRoom", curUser._id);
                    setIsLeaving(true);
                }
            });
        } else {
            socket.emit("leaveRoom", curUser._id);
            setIsLeaving(true);
        }
    }

    const handlePlay = () => {
        if(room.player1.id === null || room.player2.id === null) swal(`Room ${room.roomId}`, 'C???n 2 ng?????i ch??i ????? b???t ?????u', "error");
        else if(curUser._id === room.player1.id || curUser._id === room.player2.id) {
            socket.emit("startGame", {
                ...room,
                nextTurn: 1,
                status: 1,
                curGame: {
                    date: Date.now,
                    player1: {
                        id: room.player1.id,
                        name: room.player1.name
                    },
                    player2: {
                        id: room.player2.id,
                        name: room.player2.name
                    },
                    winner: 0,
                    move: [],
                    chat: []
                }
            });
        }
        else swal(`Room ${room.roomId}`, 'B???n ph???i l?? m???t trong hai ng?????i ch??i ch??nh ????? th???c hi???n ch???c n??ng n??y', "error");
    } 

    const handleDefeat = () => {
        if(curUser._id === room.player1.id || curUser._id === room.player2.id) {
            swal({
                title: "B???n c?? ch???c ch???n ?????u h??ng tr?????c ?????i th??? ?",
                icon: "warning",
                buttons: {
                    confirm: {
                        text: "X??c nh???n",
                        value: "confirm"
                    },
                    cancel: "Kh??ng"
                },
            })
            .then((value) => {
                if(value === "confirm") {
                    socket.emit("gameResult", {
                        room: {
                            ...room,
                            status: 0
                        },
                        winner: curUser._id === room.player1.id ? 2 : 1,
                        resultType: "winLose" // C??n 1 type n???a l?? "draw"
                    });
                }
            });
        }
        else swal(`Room ${room.roomId}`, 'B???n ph???i l?? m???t trong hai ng?????i ch??i ch??nh ????? th???c hi???n ch???c n??ng n??y', "error");
    }

    const handleDraw = () => {
        if(curUser._id === room.player1.id || curUser._id === room.player2.id) {
            socket.emit("drawRequest", {
                roomId: room.roomId,
                from: curUser._id === room.player1.id ? 1 : 2
            });
            swal({
                title: "Xin h??a",
                text: "??ang ?????i ?????i th??? ch???p nh???n h??a...",
                icon: loading,
                button: "H???y",
                dangerMode: true,
            });
        }
        else swal(`Room ${room.roomId}`, 'B???n ph???i l?? m???t trong hai ng?????i ch??i ch??nh ????? th???c hi???n ch???c n??ng n??y', "error");
    }

    const handleGetDrawRequest = (response) => {
        if((response.from === 1 && curUser._id === room.player2.id)
            || (response.from === 2 && curUser._id === room.player1.id)) {
            swal({
                title: "?????i th??? mu???n h??a v???i b???n",
                text: "B???n c?? ?????ng ?? ?",
                icon: "info",
                buttons: {
                    confirm: {
                        text: "X??c nh???n",
                        value: "confirm"
                    },
                    cancel: "Kh??ng"
                },
            })
            .then((value) => {
                if(value === "confirm") {
                    socket.emit("gameResult", {
                        room: {
                            ...room,
                            status: 0
                        },
                        winner: 0,
                        resultType: "draw" // C??n 1 type n???a l?? "winLose"
                    });
                } else {
                    socket.emit("deniedDrawRequest", {
                        roomId: room.roomId,
                        from: curUser._id === room.player1.id ? 1 : 2
                    })
                }
            });
        }
    }

    const handleAnswerDrawRequest = (response) => {
        if((response.from === 1 && curUser._id === room.player2.id)
            || (response.from === 2 && curUser._id === room.player1.id)) {
            swal({
                title: "?????i th??? t??? ch???i ????? ngh??? h??a",
                text: ":((((",
                icon: "error"
            })
        }
    }

    const handleOverTime = (id) => {
        console.log(id);
        console.log(room);
        if(id === 1) {
            socket.emit("gameResult", {
                room: {
                    ...room,
                    status: 0
                },
                winner: 2,
                resultType: "winLose" // C??n 1 type n???a l?? "draw"
            });
        } else if (id === 2) {
            socket.emit("gameResult", {
                room: {
                    ...room,
                    status: 0
                },
                winner: 1,
                resultType: "winLose" // C??n 1 type n???a l?? "draw"
            });
        }
    }

    const isMyTurn = () => {
        if(room.status === 0) return false;
        else {
            if(curUser._id === room.player1.id) {
                if(room.nextTurn === 1) return true;
                return false;
            } else if(curUser._id === room.player2.id) {
                if(room.nextTurn === 2) return true;
                return false;
            }
        }
    }

    const handleTimer1 = () => {
        if(room.status === 0) return false;
        if(room.nextTurn === 1) {
            return true;
        }
        else return false
    }

    const handleTimer2 = () => {
        if(room.status === 0) return false;
        if(room.nextTurn === 2) {
            return true;
        }
        else return false
    }

    const showGameResult = (response) => {
        const { winner, loser, resultType} = response;
        if(resultType !== "winLose") {
            if(curUser._id === winner.id) {
                if(winner.first_elo < winner.final_elo) {
                    swal("H??a", 
                        "Elo ban ?????u: " + `${winner.first_elo}\n` +
                        "T??ng l??n:    "  + `${winner.final_elo}` + " ???", 
                        "info"
                    );
                } else if(winner.first_elo > winner.final_elo) {
                    swal("H??a", 
                        "Elo ban ?????u: " + `${winner.first_elo}\n` +
                        "Gi???m xu???ng:  "  + `${winner.final_elo}` + " ???", 
                        "info"
                    );
                } else {
                    swal("H??a", 
                        "Elo ban ?????u: " + `${winner.first_elo}\n` +
                        "Gi??? nguy??n:  "  + `${winner.final_elo}`, 
                        "info"
                    );
                }
            } else if (curUser._id === loser.id) {
                if(loser.first_elo < loser.final_elo) {
                    swal("H??a", 
                        "Elo ban ?????u: " + `${loser.first_elo}\n` +
                        "T??ng l??n:    "  + `${loser.final_elo}` + " ???", 
                        "info"
                    );
                } else if(loser.first_elo > loser.final_elo) {
                    swal("H??a", 
                        "Elo ban ?????u: " + `${loser.first_elo}\n` +
                        "Gi???m xu???ng:  "  + `${loser.final_elo}` + " ???", 
                        "info"
                    );
                } else {
                    swal("H??a", 
                        "Elo ban ?????u: " + `${loser.first_elo}\n` +
                        "Gi??? nguy??n:  "  + `${loser.final_elo}`, 
                        "info"
                    );
                }
            } else {
                swal("K???t qu???", 
                    "H??a", 
                    "success"
                );
            }
        } else {
            if(curUser._id === winner.id) {
                swal("B???n l?? ng?????i chi???n th???ng", 
                    "Elo ban ?????u: " + `${winner.first_elo}\n` +
                    "T??ng l??n:    "  + `${winner.final_elo}` + " ???", 
                    "success"
                );
            } else if (curUser._id === loser.id) {
                    swal("B???n ???? thua", 
                    `Elo ban ?????u: ${loser.first_elo}\n` +
                    `Gi???m xu???ng:  ${loser.final_elo} ???`, 
                    "error"
                );
            } else {
                if(winner.id === room.player1.id)
                    swal("K???t qu???", 
                        `Ng?????i ch??i X chi???n th???ng`, 
                        "success"
                    );
                else
                    swal("K???t qu???", 
                        `Ng?????i ch??i O chi???n th???ng`, 
                        "success"
                    );
            }
        }
    }

    const handleClickOpenInviteDialog = () => {
        let invitableUsers = usersOnline;
        for(let a=0; a < invitableUsers.length; a++)
        {
            invitableUsers[a].invited = false;
        }
        setUsersOnline(invitableUsers);
        console.log(usersOnline);
        setOpenInviteDialog(true);
    };

    const handleCloseInviteDialog = () => {
        setOpenInviteDialog(false);
    };
    
    const handleClickInvitePlayer = (invitedPlayer) =>{
        invitedPlayer.invited = true;
        let invitableUsers = usersOnline;
        for(let a=0; a < invitableUsers.length; a++)
        {
            if(invitableUsers[a].userId === invitedPlayer.userId)
            {
                invitableUsers[a] = invitedPlayer;
            }
        }
        invitableUsers = invitableUsers.concat({"socketId":"","userId":curUser._id,"userName":"","invited":false});
        setUsersOnline(invitableUsers);
        console.log(usersOnline);
        console.log( invitedPlayer);
        socket.emit("invitePlayer", {"playerInviteName":curUser.name,"room":roomID,"invitePlayerId":invitedPlayer.userId});
    };

    if(isLeaving) return <Redirect to="/" />
  
    return (
        <div>
            <div style={{textAlign:'center'}}>
                <h1>Room {roomID}</h1>
            </div>
            <Grid container>
                    <Grid container justify="center">
                        <Grid item xs={1}/>
                        <Grid item xs={10}>
                            <Grid container spacing={5}>
                                <Grid item xs={12} md={7} style={{minWidth: '705px'}}>
                                    <Grid container justify='center'>
                                        <CaroGame isStart={isMyTurn()} room={room} socket={socket}/>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12} md={5} style={{minWidth: '570px'}}>
                                    <Grid container direction='row' style={{marginBottom: '20px'}}>
                                        <Card style={{borderRadius: '20px', width:'45%'}}>
                                            <CardHeader 
                                                style={{backgroundColor: room.nextTurn === 1 ? 'red' : 'gray', textAlign: 'center'}}
                                                title="#Ng?????i ch??i (X)"
                                            />
                                            <CardContent>
                                                { room.player1.name ? 
                                                <Typography variant="h5" component="h4" style={{textAlign: 'center', color: '#03fc4e'}}>{room.player1.name}</Typography>
                                                :
                                                <Typography variant="h5" component="h4" style={{textAlign: 'center'}}>Tr???ng</Typography>
                                                }
                                                <CountDown id={1} isPlaying={handleTimer1()} duration={duration} onTimeEnd={handleOverTime} changeKey={changeKey}/>
                                            </CardContent>
                                            <CardActions>
                                                <Button onClick={() => joinPlayer(1)} variant="contained" size="small" color="primary" fullWidth disabled={room.player1.name ? true : false} style={{borderRadius: '20px'}}>Tham gia</Button>
                                            </CardActions>
                                        </Card>
                                        <Card style={{borderRadius: '20px', width:'45%', marginLeft: '9%'}}>
                                            <CardHeader 
                                                style={{backgroundColor: room.nextTurn === 2 ? 'red' : 'gray', textAlign: 'center'}}
                                                title="#Ng?????i ch??i (O)"
                                            />
                                            <CardContent>
                                                { room.player2.name ? 
                                                <Typography variant="h5" component="h4" style={{textAlign: 'center', color: '#03fc4e'}}>{room.player2.name}</Typography>
                                                :
                                                <Typography variant="h5" component="h4" style={{textAlign: 'center'}}>Tr???ng</Typography>
                                                }
                                                <CountDown id={2} isPlaying={handleTimer2()} duration={duration} onTimeEnd={handleOverTime} changeKey={changeKey}/>
                                            </CardContent>
                                            <CardActions>
                                                <Button onClick={() => joinPlayer(2)} variant="contained" size="small" color="primary" fullWidth disabled={room.player2.name ? true : false} style={{borderRadius: '20px'}}>Tham gia</Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                    <Grid container direction="row" style={{marginBottom:'30px'}} justify="center" >
                                        <Button onClick={() => room.status === 0 ? handlePlay() : handleDefeat()} variant="contained" color="primary">{room.status === 0 ? "B???t ?????u" : "?????u h??ng"}</Button>
                                        <Button onClick={() => handleDraw()} style={{marginLeft:'30px'}} variant="contained" color="primary" disabled={room.status === 1 ? false : true}>Xin h??a</Button>
                                    </Grid>
                                    <Grid container direction="row" style={{marginBottom:'30px'}} justify="center" >
                                        <Button onClick={() => leavePlayer()} variant="contained" color="secondary" disabled={room.status === 0 ? false : true}>L??m kh??n gi???</Button>
                                        <Button onClick={() => handleClickOpenInviteDialog()} style={{marginLeft:'30px', backgroundColor: '#5beb6f'}} variant="contained">M???i</Button>
                                        <Button onClick={() => handleLeaveRoom()} style={{marginLeft:'30px'}} variant="contained">Tho??t ph??ng</Button>
                                    </Grid>
                                    <MessageRoom socket={socket} room={room}/>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={1}/>

                         {/* Invite players dialog */}
                        <Dialog  onClose={handleCloseInviteDialog} aria-labelledby="customized-dialog-title" open={openInviteDialog}>
                        <DialogTitle style = {{width:'300px'}} id="customized-dialog-title" onClose={handleCloseInviteDialog}>
                            Danh s??ch ng?????i ch??i online
                        </DialogTitle>
                        <DialogContent dividers>
                            <Typography gutterBottom>
                            {usersOnline.map(item => 
                                item.userId !== curUser._id && item.canInvite !== false ?
                                <div key={item.userId}>
                                    <li >
                                        <span>{item.userName}
                                        <Button disabled = {item.invited} onClick={() => handleClickInvitePlayer(item)} style={{height:'20px',float: 'right'}} variant="contained" >M???i</Button>
                                        </span>                                  
                                    </li>
                                 </div>
                            : null
                            )}
                            </Typography>
                            
                        </DialogContent>
                        <DialogActions>
                            <Button autoFocus onClick={handleCloseInviteDialog} color="primary">
                            Close
                            </Button>
                        </DialogActions>
                        </Dialog>
                </Grid>
            </Grid>
        </div>    
    )
  }
