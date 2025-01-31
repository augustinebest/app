import unittest
from faker import Faker
import requests
from fyipe_sdk import FyipeLogger

class LoggerTest(unittest.TestCase):
    def setUp(self):
        self.apiUrl = "http://localhost:3002/api"
        self.fake = Faker()
        self.setUserObject()
        try:
            # create user
            createdUser = self.apiRequest(self.apiUrl + "/user/signup", self.user, {})

            # get token and project
            token = createdUser["tokens"]["jwtAccessToken"]
            self.header = {"Authorization": "Basic " + token}
            self.project = createdUser["project"]

            # create a component
            component = {"name": self.fake.word()}
            createdComponent = self.apiRequest(
                self.apiUrl + "/component/" + self.project["_id"],
                component,
                self.header,
            )
            self.component = createdComponent

            # create an applicationlog and set it as the global application Log.
            appLog = {"name": self.fake.word()}
            createdApplicationLog = self.apiRequest(
                self.apiUrl
                + "/application-log/"
                + self.project["_id"]
                + "/"
                + createdComponent["_id"]
                + "/create",
                appLog,
                self.header,
            )
            self.applicationLog = createdApplicationLog

        except requests.exceptions.HTTPError as error:
            print("Couldnt create an application log to run a test, Error occured: ")
            print(error)

    def setUserObject(self):
        self.user = {
            "name": self.fake.name(),
            "password": "1234567890",
            "confirmPassword": "1234567890",
            "email": self.fake.ascii_company_email(),
            "companyName": self.fake.company(),
            "jobRole": self.fake.job(),
            "companySize": self.fake.random_int(),
            "card": {"stripeToken": "tok_visa"},
            "subscription": {"stripePlanId": 0},
            "cardName": self.fake.credit_card_provider(),
            "cardNumber": self.fake.credit_card_number(),
            "cvv": self.fake.credit_card_security_code(),
            "expiry": self.fake.credit_card_expire(),
            "city": self.fake.city(),
            "state": self.fake.country(),
            "zipCode": self.fake.postcode(),
            "companyRole": self.fake.job(),
            "companyPhoneNumber": self.fake.phone_number(),
            "planId": "plan_GoWIYiX2L8hwzx",
            "reference": "Github",
        }
        return self

    def apiRequest(self, url, body, headers):
        response = requests.post(url, body, headers=headers)
        return response.json()

    def test_application_log_key_is_required(self):
        logger = FyipeLogger(self.apiUrl, self.applicationLog["_id"], "")
        response = logger.log("test content")
        self.assertEqual(
            "Application Log Key is required.",
            response["message"],
            "Application Log Key Required",
        )

    def test_content_is_required(self):
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.log("")
        self.assertEqual(
            "Content to be logged is required.", response["message"], "Content Required"
        )

    def test_valid_applicaiton_log_id_is_required(self):
        logger = FyipeLogger(
            self.apiUrl, "5eec6f33d7d57033b3a7d502", self.applicationLog["key"]
        )
        response = logger.log("content")
        self.assertEqual(
            "Application Log does not exist.",
            response["message"],
            "Valid Application Log",
        )

    def test_valid_string_content_of_type_info_is_logged(self):
        log = "sample content to be logged"
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.log(log)
        self.assertEqual(log, response["content"])
        self.assertEqual("info", response["type"])

    def test_valid_object_content_of_type_info_is_logged(self):
        log = {"location": "Atlanta", "country": "USA"}
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.log(log)
        self.assertEqual(log["location"], response["content"]["location"])
        self.assertEqual(True, isinstance(response["content"], dict))

    def test_valid_string_content_of_type_error_is_logged(self):
        log = "sample content to be logged"
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.error(log)
        self.assertEqual(log, response["content"])
        self.assertEqual("error", response["type"])

    def test_valid_object_content_of_type_warning_is_logged(self):
        log = "sample content to be logged"
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.warning(log)
        self.assertEqual(log, response["content"])
        self.assertEqual("warning", response["type"])

    def test_valid_object_content_of_type_info_with_one_tag_is_logged(self):
        log = {"location": "Atlanta", "country": "USA"}
        tag = "intent"
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.log(log, tag)
        self.assertEqual(log["location"], response["content"]["location"])
        self.assertEqual("info", response["type"])
        self.assertIsInstance(response["tags"], list)
        self.assertIn(tag, response["tags"])

    def test_valid_object_content_of_type_error_with_no_tag_is_logged(self):
        log = {"location": "Atlanta", "country": "USA"}
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.error(log)
        self.assertEqual(log["location"], response["content"]["location"])
        self.assertEqual("error", response["type"])

    def test_valid_object_content_of_type_warning_with_four_tags_is_logged(self):
        log = {"location": "Atlanta", "country": "USA"}
        tag = ["Enough", "python", "Error", "Serverside"]
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.warning(log, tag)
        self.assertEqual(log["country"], response["content"]["country"])
        self.assertEqual("warning", response["type"])
        self.assertIsInstance(response["tags"], list)
        self.assertEqual(len(tag), len(response["tags"]))
        for item in tag:
            self.assertIn(item, response["tags"])

    def test_valid_object_content_of_type_warning_return_invalid_tags(self):
        log = {"location": "Atlanta", "country": "USA"}
        tag = 500
        logger = FyipeLogger(
            self.apiUrl, self.applicationLog["_id"], self.applicationLog["key"]
        )
        response = logger.warning(log, tag)
        self.assertEqual("Invalid Content Tags to be logged", response, "Invalid Tags")


if __name__ == "__main__":
    unittest.main()
