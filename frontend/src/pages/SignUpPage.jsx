import * as React from 'react';
import { useFormik } from 'formik';
import { makeStyles } from '@mui/styles';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { theme } from '../theme';
import { ThemeProvider } from '@mui/material/styles';
import { useHistory } from "react-router-dom";
const axios = require('axios');

// A custom validation function. This must return an object
// which keys are symmetrical to our values/initialValues
const validate = values => {
    const errors = {};
    if (!values.username) {
        errors.username = 'Required';
    } else if ((values.username.length > 30) || (values.username.length < 6)) {
        errors.username = 'Must be between 30 and 6 characters long';
    }

    if (!values.email) {
        errors.email = 'Required';
    } else if (!/e[0-9]{7}@u.nus.edu/gi.test(values.email)) {
        errors.email = 'NUS email address required';
    }
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,10}$/;
    if (!values.password) {
        errors.password = 'Required';
    } else if (!regex.test(values.password)) { 
        errors.password = 'Password must be at least 8 characters long and contain a number, symbol, uppercase character and lowercase character.';
    }

    if (!values.confirmpassword) {
        errors.confirmpassword = 'Required';
    }

    if (values.confirmpassword != values.password) {
        errors.confirmpassword = 'Different passwords provided';
    }

    return errors;
};

const useStyles = makeStyles(theme => ({
    fullScreenHeight: {
        minHeight: "85vh"
    }
}));

export default function SignUp() {
    const classes = useStyles();
    // Pass the useFormik() hook initial form values, a validate function that will be called when
    // form values change or fields are blurred, and a submit function that will
    // be called when the form is submitted
    let history = useHistory();

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmpassword: '',
        },
        validate,
        onSubmit: values => {
            // alert(JSON.stringify(values, null, 2));
            axios.post(`${process.env.REACT_APP_dockerauthserver||'http://localhost/api/user/'}register/`, values)
              .then(function (response) {
                console.log(response);
                history.push("/login");
              })
              .catch(function (error) {
                console.log(error);
              });
        },
    });

    return (
            <Container component="main" maxWidth="xs" className={classes.fullScreenHeight}>
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign up
                    </Typography>
                    <Box component="form" noValidate onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12}>
                                <TextField
                                    autoComplete="username"
                                    name="username"
                                    required
                                    fullWidth
                                    id="username"
                                    label="Username"
                                    autoFocus
                                    onChange={formik.handleChange}
                                    value={formik.values.username}
                                />
                                {formik.errors.username ? <div>{formik.errors.username}</div> : null}
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                    onChange={formik.handleChange}
                                    value={formik.values.email}

                                />
                                {formik.errors.email ? <div>{formik.errors.email}</div> : null}
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="new-password"
                                    onChange={formik.handleChange}
                                    value={formik.values.password}
                                />
                                {formik.errors.password ? <div>{formik.errors.password}</div> : null}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="confirmpassword"
                                    label="Confirm Password"
                                    type="password"
                                    id="confirmpassword"
                                    autoComplete="new-password"
                                    onChange={formik.handleChange}
                                    value={formik.values.confirmpassword}
                                />
                                {formik.errors.confirmpassword ? <div>{formik.errors.confirmpassword}</div> : null}
                            </Grid>
                        </Grid>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign Up
                        </Button>
                        <Grid container justifyContent="flex-end">
                            <Grid item>
                                <Link href="login" variant="body2">
                                    Already have an account? Sign in
                                </Link>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Container>
    );
}