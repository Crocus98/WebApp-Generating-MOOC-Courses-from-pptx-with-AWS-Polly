
/*export const load = async (req: Request, res: Response) => {
    try {
        let { email, password, newAdminMail } = req.body;
        //check mail
        email = utils.parseMail(email);
        if (!email) {
            return res.status(400).send("Missing or invalid email");
        }
        //check password
        password = utils.parsePassword(password);
        if (!password) {
            return res.status(400).send("Password too short. Minimum 8 characters");
        }
        //login
        const [result, message] = await UserService.assignAdminPermissions(email, password, newAdminMail);
        if (!result) {
            return res.status(400).send(message);
        }
        //successful login
        res.status(200).send("Success");
    }
    catch (error) {
        return res.status(500).send(utils.getErrorMessage(error));
    }
};*/