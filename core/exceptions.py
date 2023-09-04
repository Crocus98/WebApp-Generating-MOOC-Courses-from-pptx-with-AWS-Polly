# List of exceptions

class UserParameterException(Exception):
    def __init__(self, message="A user parameter exception occurred"):
        self.message = message
        super().__init__(self.message)


class ElaborationException(Exception):
    def __init__(self, message="A elaboration exception occurred"):
        self.message = message
        super().__init__(self.message)


class AmazonException(Exception):
    def __init__(self, message="A Amazon exception occurred"):
        self.message = message
        super().__init__(self.message)
