export default class Utils {
    static getErrorMessage(error: unknown) {
        if (error instanceof Error) return error.message;
        return String(error);
    }

    static parseMail(email: string) {
        if (this.isUndefinedOrEmpty(email)) return null;
        email = email.trim().toLowerCase();
        const regex = /^\S+@\S+\.\S+$/; //email regex => consider to use a library instead
        return (regex.test(email)) ? email : null;
    }

    static parsePassword(password: string) {
        if (this.isUndefinedOrEmpty(password) || password.length < 8) return null;
        return password;
    }

    static isUndefinedOrEmpty(value: string | undefined): boolean {
        return (value === undefined || value.trim().length === 0)
    }
}