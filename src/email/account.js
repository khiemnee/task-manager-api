import mailGun from "mailgun-js";

const mailGunApi = process.env.mailGunApi
const domain = 'sandbox9de5b237e307428e8dd1dda944e97bc7.mailgun.org'


const mg = mailGun({apiKey: mailGunApi,domain});



const sendWelcomeEmail = (name,email) =>{

    const data = {
        from: 'Excited User <me@samples.mailgun.org>',
        to: email,
        subject: 'Hello',
        text: `hello ${name}`
    };

    mg.messages().send(data, function (error, body) {
        console.log(error);
    });
    

}

export default sendWelcomeEmail

