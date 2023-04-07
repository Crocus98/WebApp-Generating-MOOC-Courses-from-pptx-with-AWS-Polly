
export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error);
}

export function checkMail(email: string) {
    email = email.trim().toLowerCase();
    const regex = /^\S+@\S+\.\S+$/; //email regex => consider to use a library instead
    return (regex.test(email)) ? email : null;
}

export function checkPassword(password: string) {
    return (password.length < 8) ? null : password;
}

export function isUndefinedOrEmpty(value: string | undefined): boolean {
    return (value === undefined || value.trim().length === 0)
}