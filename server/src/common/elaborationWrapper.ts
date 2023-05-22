

class ElaborationWrapper {
    private static elaborationWrapper?: ElaborationWrapper;

    constructor() {
        // TODO
    }

    async elaborateFile(email: string) {
        // TODO
    }


    static getInstance(): ElaborationWrapper {
        if (!this.elaborationWrapper) this.elaborationWrapper = new ElaborationWrapper();
        return this.elaborationWrapper;
    }
}