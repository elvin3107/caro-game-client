import React, { useEffect, useState    } from 'react';
import { Avatar, LinearProgress, Button, Typography, Grid, TextField, CssBaseline, Container, Step, Stepper, StepLabel } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import { Link } from 'react-router-dom';
import userApi from '../api/userApi';
import MuiAlert from '@material-ui/lab/Alert';
import swal from 'sweetalert';

function Alert(props) {
    return <MuiAlert style={{width: '100%'}} elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    title: {
        marginBottom: theme.spacing(5)
    },
    linkProfile: {
        textDecoration: 'none'
    },
    button: {
        marginTop: theme.spacing(3)
    }
}));

export default function SignIn() {
    const [info, setInfo] = useState({
      email: "", 
      token: "",
      password: "",
      retypePassword: ""
    });
    const [process, setProcess] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const classes = useStyles();

    const handleSubmit = async (e) => {
        try{
            e.preventDefault();
            setIsLoading(true);

            const response = await userApi.forgetPassword(info.email);
            if(response.result) {
                setProcess(2);
                setIsLoading(false);
            }
        } catch(err) {
            setIsLoading(false);
            if(err.response.status === 403) swal(err.response.data.message, "", "error");
            else if(err.response.status === 400) swal(err.response.data.details[0].message, "", "warning");
            else swal('Server kh??ng ph???n h???i', "", "error");
        }
    };

    const handleSubmitConfirmToken = async (e) => {
        try{
            e.preventDefault();
            setIsLoading(true);

            const response = await userApi.confirmToken(info.token);
            if(response.result) {
                setProcess(3);
                setIsLoading(false);
            }
        } catch(err) {
            setIsLoading(false);
            swal('Code ?????t l???i m???t kh???u kh??ng h???p l???', "", "error");
        }
    }

    const handleSubmitChangePassword = async (e) => {
        try{
            e.preventDefault();
            if(info.password !== info.retypePassword) 
            {
                swal("Nh???p l???i m???t kh???u kh??ng tr??ng kh???p", "", "info");
                return;
            }
            setIsLoading(true);

            const response = await userApi.resetPassword(info.token, info.password);
            if(response.result) {
                setProcess(4);
                setIsLoading(false);
            }
        } catch(err) {
            setIsLoading(false);
            if(err.response.status === 400) swal(err.response.data.details[0].message, "", "warning");
            else swal('Server kh??ng ph???n h???i', "", "error");
        }
    }

    return (
        <Container component="main" maxWidth="xs">
        {isLoading ? <LinearProgress></LinearProgress> : <></>}
        <CssBaseline />
        <div className={classes.paper}>
            <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" className={classes.title}>
            Qu??n m???t kh???u
            </Typography>
            <Stepper alternativeLabel activeStep={process - 1} style={{background: '#fafafa'}}>
                <Step>
                    <StepLabel>??i???n Email</StepLabel>
                </Step>
                <Step>
                    <StepLabel>X??c nh???n m?? code</StepLabel>
                </Step>
                <Step>
                    <StepLabel>?????t l???i m???t kh???u</StepLabel>
                </Step>
            </Stepper>
            {process === 1 ? // ??i???n email
                <form method="form" id="form-data" className="form" onSubmit={handleSubmit} autoComplete="off">
                    <Typography component="h1" variant="h6" align="center">
                        ??i???n t??i kho???n (email) c???a b???n
                    </Typography>
                    <TextField variant="outlined" margin="normal" required fullWidth id="email" label="T??i kho???n" name="email" autoComplete="email" autoFocus 
                        onChange={e => setInfo({ ...info, email: e.target.value})} value={info.email}  />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        G???i code ?????n email c???a t??i
                    </Button>
                    <Grid container justify="center" alignItems="center">
                        <Link to="/signin" variant="body2">
                            ??i ?????n ????ng nh???p
                        </Link>
                    </Grid>
                </form>
                : process === 2 ? // ??i???n reset code
                <form method="form" id="form-data" className="form" onSubmit={handleSubmitConfirmToken} autoComplete="off">
                    <Typography component="h1" variant="h6" align="center">
                        ??i???n code ?????t l???i m???t kh???u
                    </Typography>
                    <TextField variant="outlined" margin="normal" required fullWidth id="resetCode" label="Code" name="Reset Code" autoFocus 
                        onChange={e => setInfo({ ...info, token: e.target.value})} value={info.token}  />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        X??c nh???n
                    </Button>
                    <Grid container justify="center" alignItems="center">
                        <Link to="/signin" variant="body2">
                        ??i ?????n ????ng nh???p
                        </Link>
                    </Grid>
                </form>
                : process === 3 ? // ??i???n m???t kh???u m???i
                <form method="form" id="form-data" className="form" onSubmit={handleSubmitChangePassword} autoComplete="off">
                    <Typography component="h1" variant="h6" align="center">
                        ??i???n m???t kh???u m???i
                    </Typography>
                    <TextField variant="outlined" margin="normal" required fullWidth name="password" label="M???t kh???u" type="password" id="password"
                        onChange={e => setInfo({ ...info, password: e.target.value})} autoComplete="current-password" value={info.password}/>
                    <TextField variant="outlined" margin="normal" required fullWidth name="password" label="Nh???p l???i m???t kh???u" type="password" id="repassword"
                        onChange={e => setInfo({ ...info, retypePassword: e.target.value})} value={info.retypePassword} />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                    >
                        ?????i m???t kh???u
                    </Button>
                    <Grid container justify="center" alignItems="center">
                        <Link to="/signin" variant="body2">
                        ??i ?????n ????ng nh???p
                        </Link>
                    </Grid>
                </form>
                :
                <>
                    <Alert severity="success">?????t l???i m???t kh???u th??nh c??ng</Alert>
                    <Link to='/signin' className={classes.linkProfile}>
                        <Button variant="outlined" color="primary" className={classes.button}>
                        ??i ?????n ????ng nh???p
                        </Button>
                    </Link>
                </>
            }   
        </div>
        </Container>
    );
}