import React,{useState, useEffect} from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import {Card,CardContent,Table,TableBody ,TableCell ,TableContainer ,TableHead ,Paper ,TableRow ,
TablePagination, Grid, Button,Modal,Input, CardActions, TextField } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import { Redirect, useHistory, Link} from 'react-router-dom';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import swal from 'sweetalert';
import loading from "./loading.svg"
//styles setting
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
  }
});

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);
const StyledTableRow = withStyles((theme) => ({
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

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




//function component
export default function Dashboard(props) {
  const history = useHistory();
  const [usersOnline,setUsersOnline] = useState([]);
  const [playRooms,setPlayRooms] = useState([]);
  const isLoggedIn = props.isLogin;
  const socket = props.socket;
  const curUser = JSON.parse(localStorage.getItem('curUser'));
  const classes = useStyles();
  
  const [modalStyle] = useState(getModalStyle);
  const [openCreateRoomModal, setOpenCreateRoomModal] = useState(false);
  const [openJoinRoomModal, setOpenJoinRoomModal] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [roomDialog, setRoomDialog] = useState({});
  const [roomDialogPlayer1,setRoomDialogPlayer1] = useState({});
  const [roomDialogPlayer2,setRoomDialogPlayer2] = useState({});
  const [newRoomType,setNewRoomType] = useState('unlock');
  const [newRoomPassword,setNewRoomPassword] = useState('');
  const [newRoomTimePerRound,setNewRoomTimePerRound] = useState('50');
  const [joinRoomPassword,setJoinRoomPassword] = useState('');
  const [roomSelected,setRoomSelected] = useState({});
  const [idJoinRoom, setIdJoinRoom] = useState('')
  const [isFindQuickGame,setIsFindQuickGame] = useState(false);
  const [isAcceptInvite,setIsAcceptInvite] = useState({"isaccept":false,"room":null});
  const [customTPR, setCustomTPR] = useState(false);
  const handleNewRoomTypeChange = (event) => {
    setNewRoomType(event.target.value);
  };

  const handleNewRoomTimePerRoundChange = (event) => {
    if(event.target.value === "custom") {
      setCustomTPR(true);
      setNewRoomTimePerRound("5");
    } else {
      setCustomTPR(false);
      setNewRoomTimePerRound(event.target.value);
    }
  };

  const handleNewRoomPasswordChange = (event) => {
    setNewRoomPassword(event.target.value);
  }

  const handleJoinRoomPasswordChange = (event) => {
    setJoinRoomPassword(event.target.value);
  }

  const handleIdJoinRoomChange= (event) => {
    setIdJoinRoom(event.target.value);
  }

  const handleClickOpenDialog = (room) => {
    setOpenDialog(true);
    setRoomDialog(room);
    setRoomDialogPlayer1(room.player1);
    setRoomDialogPlayer2(room.player2);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenCreateRoomModal= () => {
    setOpenCreateRoomModal(true);
    setNewRoomPassword('');
    setNewRoomType('unlock');
    setNewRoomTimePerRound('50');
  }

  const handleCloseCreateRoomModal= () => {
    setOpenCreateRoomModal(false);
    setNewRoomPassword('');
    setNewRoomType('unlock');
  }

  const handleOpenJoinRoomModal= () => {
    setOpenJoinRoomModal(true);
  }

  const handleCloseJoinRoomModal= () => {
    setOpenJoinRoomModal(false);
    setJoinRoomPassword('');
    setRoomSelected({});
  }

  if(isLoggedIn === true)
  {
    if(curUser!==null){
      socket.emit("login", {
        id: curUser._id, 
        name: curUser.name
      }); 
    }
  }

  useEffect(()=>{
    socket.on('updateUsersOnlineList', (response) => setUsersOnline(response)); 
    socket.on('updateRoomsList',  (response) => setPlayRooms(response));
    socket.on('inviteToPlay', (response) => {
      if(response.invitePlayerId === curUser._id)
      {
        swal({
          title: "B???n nh???n ???????c l???i m???i?",
          text: "Ng?????i ch??i " + response.playerInviteName + " m???i b???n v??o room " + response.room + "!",
          icon: "warning",
          buttons: {
            cancel: "T??? ch???i",
            catch: {
              text: "Ch???p nh???n",
              value: "accept",
            }},
          dangerMode: false,
        })
        .then((value) => {
          if(value === "accept")
          {
            setIsAcceptInvite({"isaccept":true,"room":response.room});
          }     
        });
      }});
    socket.on('findedQuickGame',  (response) => {
      if(response.idPlayer1 === curUser._id || response.idPlayer2 === curUser._id)
      {
        setIsFindQuickGame(false);
        joinRoom(response.idRoom,'unlock',null);
        swal.close();
      }
    });
  }, []);
  
  const createRoom = () => {
    if(Number.parseInt(newRoomTimePerRound) < 5) swal("Th???i gian t???i thi???u l?? 5 gi??y", "", "warning");
    else if (Number.parseInt(newRoomTimePerRound) > 200) swal("Th???i gian t???i ??a l?? 200 gi??y", "", "warning");
    else {
      socket.emit("createRoom", {'hostName':curUser.name,'newRoomType':newRoomType,'newRoomPassword':newRoomPassword,'newRoomTimePerRound':newRoomTimePerRound});
      socket.emit("joinRoom",  {"roomId":(playRooms.length + 1),"playerId":curUser._id});
      const path = (playRooms.length + 1).toString();
      history.push(path);
    }
  }

  const joinRoom = (id,roomType,roomPassword) => {
    if(roomType === 'unlock')
    {
      socket.emit("joinRoom", {"roomId":id,"playerId":curUser._id});
      const path = id.toString();
      history.push(path);
    }
    else 
    {
      handleOpenJoinRoomModal();
      setRoomSelected({'id':id,'password':roomPassword});
    }
  }

  const joinLockRoom = () =>{
    if(joinRoomPassword === roomSelected.password)
    {
      socket.emit("joinRoom", {"roomId":roomSelected.id,"playerId":curUser._id});
      const path = roomSelected.id.toString();
      history.push(path);
    }
    else {
      swal("??i kh??ng!", "Password kh??ng ch??nh x??c!", "error");
    }
  }

  const joinRoomById = () =>{
    for (let a=0; a < playRooms.length; a++) {
      if (playRooms[a].roomId == idJoinRoom) {
        joinRoom(playRooms[a].roomId,playRooms[a].type,playRooms[a].password)
        break;
      }
    }
  }

  const leaveRoom = () =>{
    socket.emit("leaveRoom", curUser._id);
  };

  const quickPlay = () =>{
    socket.emit("joinQuickGame", {"id":curUser._id,"elo":curUser.elo});
    setIsFindQuickGame(true);
    swal({
      title: "Ch??i nhanh",
      text: "??ang ti???n h??nh gh??p c???p...",
      icon: loading,
      button: "H???y",
      dangerMode: true,
    }).then(() => {
      setIsFindQuickGame(false);
      socket.emit("outQuickGame", {"id":curUser._id});
    });
  }

  if(isAcceptInvite.isaccept === true)
  {
    for (let a=0; a < playRooms.length; a++) {
      if (playRooms[a].roomId == isAcceptInvite.room) {
        joinRoom(playRooms[a].roomId,playRooms[a].type,playRooms[a].password);

        break;
      }
    }
    setIsAcceptInvite({"isaccept":false,"room":null});

  }

  return (
    <div >
      {!isLoggedIn ? <Redirect to="/signin"/>: 
            <div>
              <div style={{textAlign: 'center',padding:'10px'}}>
                <Button style={{marginRight:'30px',backgroundColor:"green"}} variant="contained" color="primary" onClick={() => quickPlay()} >Ch??i nhanh</Button>
                <Button variant="contained" color="primary" onClick={() => handleOpenCreateRoomModal()} >T???o ph??ng m???i</Button>
                <Input style={{marginLeft:'30px',marginRight:'10px'}} placeholder="Nh???p ID ph??ng" onChange={handleIdJoinRoomChange}></Input> 
                <Button variant="contained"  onClick={() => joinRoomById()} >Tham gia</Button>
              </div>
              <Grid container >
                <Grid item xs={12}>
                  <Grid container justify="center" >
                  <TableContainer style={{width:'60%'}} component={Paper}>
                    <Table >
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>ID room</StyledTableCell>
                          <StyledTableCell align="center">Ng?????i t???o</StyledTableCell>
                          <StyledTableCell align="center">Tr???ng th??i</StyledTableCell>
                          <StyledTableCell align="center">Lo???i ph??ng</StyledTableCell>
                          <StyledTableCell align="center"></StyledTableCell>
                          <StyledTableCell align="center"></StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                      {playRooms.map((room) => (
                        <StyledTableRow key={room.roomId} >
                          <StyledTableCell component="th" scope="row">
                            {room.roomId}
                          </StyledTableCell>
                          <StyledTableCell align="center">{room.hostName}</StyledTableCell>
                          <StyledTableCell align="center">{room.status === 0 ? '??ang ch???' : '???? ch??i'}</StyledTableCell>
                          <StyledTableCell align="center" style={{color: room.type === 'lock' ? 'red' : 'blue'}}>{room.type === 'lock' ? 'Kh??a' : 'Kh??ng kh??a'}</StyledTableCell>
                          <StyledTableCell align="center"><Button color="primary" onClick={() => joinRoom(room.roomId,room.type,room.password)}>Tham gia</Button></StyledTableCell>
                          <StyledTableCell align="center"><Button color="primary" onClick={() => handleClickOpenDialog(room)}>Th??ng tin</Button></StyledTableCell>
                        </StyledTableRow>
                      ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                    <Card style={{margin:'10px'}}>
                      <CardContent style={{textAlign: 'left'}}>
                      <h2>List Users Online</h2>
                      {usersOnline.map(item =>
                            <li key={item.userId}><Button href={'/user/'+item.userId} size="small" style={{textTransform: 'none'}}>{item.userName}</Button></li>
                      )}
                      </CardContent>
                      <CardActions>
                          <Button href='/topPlayers' fullWidth color="secondary">
                              B???ng x???p h???ng
                          </Button>
                      </CardActions>
                    </Card>
                    </Grid>
                  </Grid>
                </Grid>


                {/* Room information dialog */}
                <Dialog  onClose={handleCloseDialog} aria-labelledby="customized-dialog-title" open={openDialog}>
                  <DialogTitle style = {{width:'300px'}} id="customized-dialog-title" onClose={handleCloseDialog}>
                    Th??ng tin chi ti???t
                  </DialogTitle>
                  <DialogContent dividers>
                    <Typography gutterBottom>
                      <p style={{fontWeight: 'bold', display: 'inline'}}>Room:</p> {roomDialog.roomId}
                    </Typography>
                    <Typography gutterBottom>
                      <p style={{fontWeight: 'bold', display: 'inline'}}>Ng?????i t???o:</p>  {roomDialog.hostName}
                    </Typography>
                    <Typography gutterBottom>
                      <p style={{fontWeight: 'bold', display: 'inline'}}>Tr???ng th??i:</p>  {roomDialog.status === 0 ? '??ang ch???' : '???? ch??i'}
                    </Typography>
                    <Typography gutterBottom>
                      <p style={{fontWeight: 'bold', display: 'inline'}}>Lo???i ph??ng:</p>  {roomDialog.type === 'unlock' ? 'kh??ng kh??a' : 'kh??a'}
                    </Typography>
                    <Typography gutterBottom>
                      <p style={{fontWeight: 'bold', display: 'inline'}}>Player 1:</p>  {roomDialogPlayer1.name === null ? 'ch??a v??o' : roomDialogPlayer1.name}
                    </Typography>
                    <Typography gutterBottom>
                      <p style={{fontWeight: 'bold', display: 'inline'}}>Player 2:</p>  {roomDialogPlayer2.name === null ? 'ch??a v??o' : roomDialogPlayer2.name}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button autoFocus onClick={handleCloseDialog} color="primary">
                      ????ng
                    </Button>
                  </DialogActions>
                </Dialog>


                {/* Create New Room Modal */}
                  <Modal
                    open={openCreateRoomModal}
                    onClose={handleCloseCreateRoomModal}
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                  >
                    <div  style={modalStyle} className={classes.paper}>
                      <h2 >T???o ph??ng ch??i m???i</h2>
                      <p >
                        Vui l??ng ch???n lo???i ph??ng ch??i mu???n t???o:
                      </p>
                      <RadioGroup aria-label="gender" name="gender1" value={newRoomType} onChange={handleNewRoomTypeChange}>
                        <FormControlLabel value="unlock" control={<Radio />} label="Ph??ng m???" />
                        <FormControlLabel value="lock" control={<Radio />} label="Ph??ng kh??a" />
                      </RadioGroup>
                      <Input placeholder="Nh???p password" onChange={handleNewRoomPasswordChange}></Input> 
                      <div style={{alignItems: 'center'}}>
                      <p >
                        Vui l??ng ch???n th???i gian gi???i h???n m???i l?????t:
                      </p>
                      <RadioGroup aria-label="gender" name="gender2" defaultValue="50" onChange={handleNewRoomTimePerRoundChange}>
                        <FormControlLabel value="50" control={<Radio />} label="50 gi??y" i/>
                        <FormControlLabel value="100" control={<Radio />} label="100 gi??y" />
                        <FormControlLabel value="150" control={<Radio />} label="150 gi??y" />
                        <FormControlLabel value="custom" control={<Radio />} label="T??? quy ?????nh" />
                        {customTPR ? <Input placeholder="Th???i gian (t???i thi???u 5 gi???y, t???i ??a 200 gi??y)" value={newRoomTimePerRound} onChange={(e) => setNewRoomTimePerRound(e.target.value)}/> : <></>}
                      </RadioGroup>
                      <Button variant="contained" color="primary" onClick={() => createRoom()} style={{margin:'10px'}}>T???o ph??ng</Button>
                      </div>
                    </div>
                  </Modal>


                {/* Join Room Modal */}
                <div>
                  <Modal
                    open={openJoinRoomModal}
                    onClose={handleCloseJoinRoomModal}
                    aria-labelledby="simple-modal-title"
                    aria-describedby="simple-modal-description"
                  >
                    <div style={modalStyle} className={classes.paper}>
                      <h2 >Tham gia ph??ng</h2>
                      <p >
                        Vui l??ng nh???p m???t kh???u ph??ng:
                      </p>
                      <Input placeholder="Nh???p password" onChange={handleJoinRoomPasswordChange}></Input> 
                      <div style={{alignItems: 'center'}}>
                      <Button variant="contained" color="primary" onClick={() => joinLockRoom()} style={{margin:'10px'}}>X??c nh???n</Button>
                      </div>
                    </div>
                  </Modal>
                </div>
            </div>
          }
    </div>
  );
}