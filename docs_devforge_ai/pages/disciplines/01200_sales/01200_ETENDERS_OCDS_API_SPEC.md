{
  "openapi": "3.0.1",
  "info": {
    "title": "eTenders OCDS API - Tender Monitoring Integration",
    "description": "ETenders OCDS Public API integrated with automated tender monitoring service. Service is DISABLED by default and must be enabled via UI toggle. This API provides ETenders OCDS Releases",
    "termsOfService": "https://data.etenders.gov.za//Home/LearnMore",
    "contact": {
      "name": "Back to Transparency Portal",
      "url": "https://data.etenders.gov.za/"
    },
    "license": {
      "name": "Publication Liscence",
      "url": "https://opendatacommons.org/licenses/pddl/1-0/111"
    },
    "version": "v1"
  },
  "paths": {
    "/api/OCDSReleases": {
      "get": {
        "tags": [
          "OCDSReleases"
        ],
        "summary": "Get all OCDS releases.",
        "description": "Sample request:\r\n\r\n    GET api/OCDSReleases",
        "parameters": [
          {
            "name": "PageNumber",
            "in": "query",
            "description": "",
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 1
          },
          {
            "name": "PageSize",
            "in": "query",
            "description": "The Endpoint can only return a max of 1000 releases per page in the browser. To retrieve more at a time please use something like postman to get up to 20000 releases per page or more",
            "schema": {
              "type": "integer",
              "format": "int32"
            },
            "example": 50
          },
          {
            "name": "dateFrom",
            "in": "query",
            "description": "",
            "schema": {
              "type": "string",
              "format": "date-time"
            },
            "example": "2024-01-01"
          },
          {
            "name": "dateTo",
            "in": "query",
            "description": "",
            "schema": {
              "type": "string",
              "format": "date-time"
            },
            "example": "2024-03-31"
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ReleasePackage"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ReleasePackage"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ReleasePackage"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          },
          "500": {
            "description": "Server Error"
          }
        }
      }
    },
    "/api/OCDSReleases/release/{ocid}": {
      "get": {
        "tags": [
          "OCDSReleases"
        ],
        "summary": "Get OCDS releases by ocid.",
        "description": "Sample request:\r\n\r\n    GET api/OCDSReleases/FD019F2D-9052-4975-93D7-C73BFDB76CDF",
        "parameters": [
          {
            "name": "ocid",
            "in": "path",
            "description": "",
            "required": true,
            "schema": {
              "type": "string"
            },
            "example": "ocds-9t57fa-123456"
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/Release"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Release"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/Release"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          },
          "404": {
            "description": "Release not found",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          },
          "500": {
            "description": "Server Error"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Address": {
        "type": "object",
        "properties": {
          "streetAddress": {
            "type": "string",
            "nullable": true
          },
          "locality": {
            "type": "string",
            "nullable": true
          },
          "region": {
            "type": "string",
            "nullable": true
          },
          "postalCode": {
            "type": "string",
            "nullable": true
          },
          "countryName": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Award": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "value": {
            "$ref": "#/components/schemas/Value"
          },
          "suppliers": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Supplier"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "AwardCriteria": {
        "type": "object",
        "properties": {
          "criteria": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Criterion"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "AwardPeriod": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "format": "date-time"
          }
        },
        "additionalProperties": false
      },
      "BriefingSession": {
        "type": "object",
        "properties": {
          "isSession": {
            "type": "boolean"
          },
          "compulsory": {
            "type": "boolean"
          },
          "date": {
            "type": "string",
            "nullable": true
          },
          "venue": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Budget": {
        "type": "object",
        "properties": {
          "rationale": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Buyer": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Classification": {
        "type": "object",
        "properties": {
          "scheme": {
            "type": "string",
            "nullable": true
          },
          "id": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Communication": {
        "type": "object",
        "properties": {
          "futureNoticeDate": {
            "type": "string",
            "format": "date-time"
          },
          "atypicalToolUrl": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ContactPerson": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "email": {
            "type": "string",
            "nullable": true
          },
          "telephoneNumber": {
            "type": "string",
            "nullable": true
          },
          "faxNumber": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ContactPoint": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "telephone": {
            "type": "string",
            "nullable": true
          },
          "email": {
            "type": "string",
            "nullable": true
          },
          "faxNumber": {
            "type": "string",
            "nullable": true
          },
          "url": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Contract": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "awardID": {
            "type": "string",
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "string",
            "nullable": true
          },
          "period": {
            "$ref": "#/components/schemas/Period"
          },
          "value": {
            "$ref": "#/components/schemas/Value"
          },
          "dateSigned": {
            "type": "string",
            "nullable": true
          },
          "documents": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Document"
            },
            "nullable": true
          },
          "implementation": {
            "$ref": "#/components/schemas/Implementation"
          },
          "relatedProcesses": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RelatedProcess"
            },
            "nullable": true
          },
          "milestones": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Milestone"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ContractPeriod": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "nullable": true
          },
          "endDate": {
            "type": "string",
            "nullable": true
          },
          "maxExtentDate": {
            "type": "string",
            "nullable": true
          },
          "durationInDays": {
            "type": "integer",
            "format": "int32"
          }
        },
        "additionalProperties": false
      },
      "ContractTerms": {
        "type": "object",
        "properties": {
          "reservedExecution": {
            "type": "boolean"
          },
          "performanceTerms": {
            "type": "string",
            "nullable": true
          },
          "hasElectronicOrdering": {
            "type": "boolean"
          },
          "electronicInvoicingPolicy": {
            "type": "string",
            "nullable": true
          },
          "hasElectronicPayment": {
            "type": "boolean"
          }
        },
        "additionalProperties": false
      },
      "Criterion": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "appliesTo": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Details": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "nullable": true
          },
          "buyerProfile": {
            "type": "string",
            "nullable": true
          },
          "classifications": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Classification"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Document": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "documentType": {
            "type": "string",
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "url": {
            "type": "string",
            "nullable": true
          },
          "datePublished": {
            "type": "string",
            "nullable": true
          },
          "dateModified": {
            "type": "string",
            "nullable": true
          },
          "format": {
            "type": "string",
            "nullable": true
          },
          "language": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ElectronicAuction": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "EnquiryPeriod": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "format": "date-time",
            "nullable": true
          },
          "endDate": {
            "type": "string",
            "format": "date-time",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "FrameworkAgreement": {
        "type": "object",
        "properties": {
          "maximumParticipants": {
            "type": "integer",
            "format": "int32"
          },
          "periodRationale": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Identifier": {
        "type": "object",
        "properties": {
          "legalName": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Implementation": {
        "type": "object",
        "properties": {
          "transcations": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TransactionInformation"
            },
            "nullable": true
          },
          "milestones": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Milestone"
            },
            "nullable": true
          },
          "documents": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Document"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "LegalBasis": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "scheme": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Link": {
        "type": "object",
        "properties": {
          "next": {
            "type": "string",
            "nullable": true
          },
          "prev": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Lot": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "awardCriteria": {
            "$ref": "#/components/schemas/AwardCriteria"
          },
          "value": {
            "$ref": "#/components/schemas/Value"
          },
          "contractPeriod": {
            "$ref": "#/components/schemas/ContractPeriod"
          },
          "hasRenewal": {
            "type": "boolean"
          },
          "renewal": {
            "$ref": "#/components/schemas/Renewal"
          },
          "submissionTerms": {
            "$ref": "#/components/schemas/SubmissionTerms"
          },
          "hasOptions": {
            "type": "boolean"
          },
          "options": {
            "$ref": "#/components/schemas/Options"
          },
          "status": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Milestone": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "type": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "code": {
            "type": "string",
            "nullable": true
          },
          "dueDate": {
            "type": "string",
            "nullable": true
          },
          "dateMet": {
            "type": "string",
            "nullable": true
          },
          "dateModified": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Options": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "OrganisationReference": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "OtherRequirements": {
        "type": "object",
        "properties": {
          "reservedParticipation": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "requiresStaffNamesAndQualifications": {
            "type": "boolean"
          }
        },
        "additionalProperties": false
      },
      "Party": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "id": {
            "type": "string",
            "nullable": true
          },
          "identifier": {
            "$ref": "#/components/schemas/Identifier"
          },
          "address": {
            "$ref": "#/components/schemas/Address"
          },
          "contactPoint": {
            "$ref": "#/components/schemas/ContactPoint"
          },
          "roles": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "details": {
            "$ref": "#/components/schemas/Details"
          }
        },
        "additionalProperties": false
      },
      "Period": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "nullable": true
          },
          "endDate": {
            "type": "string",
            "nullable": true
          },
          "maxExtentDate": {
            "type": "string",
            "nullable": true
          },
          "durationInDays": {
            "type": "integer",
            "format": "int32"
          }
        },
        "additionalProperties": false
      },
      "Planning": {
        "type": "object",
        "properties": {
          "rationale": {
            "type": "string",
            "nullable": true
          },
          "budget": {
            "$ref": "#/components/schemas/Budget"
          },
          "documents": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Document"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ProblemDetails": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "detail": {
            "type": "string",
            "nullable": true
          },
          "instance": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {}
      },
      "ProcuringEntity": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Publisher": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "scheme": {
            "type": "string",
            "nullable": true
          },
          "uid": {
            "type": "string",
            "nullable": true
          },
          "uri": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "RelatedProcess": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "relationship": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "scheme": {
            "type": "string",
            "nullable": true
          },
          "identifier": {
            "$ref": "#/components/schemas/Identifier"
          },
          "uri": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Release": {
        "type": "object",
        "properties": {
          "ocid": {
            "type": "string",
            "nullable": true
          },
          "id": {
            "type": "string",
            "nullable": true
          },
          "date": {
            "type": "string",
            "nullable": true
          },
          "tag": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "initiationType": {
            "type": "string",
            "nullable": true
          },
          "tender": {
            "$ref": "#/components/schemas/Tender"
          },
          "planning": {
            "$ref": "#/components/schemas/Planning"
          },
          "parties": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Party"
            },
            "nullable": true
          },
          "buyer": {
            "$ref": "#/components/schemas/Buyer"
          },
          "language": {
            "type": "string",
            "nullable": true
          },
          "awards": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Award"
            },
            "nullable": true
          },
          "contracts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Contract"
            },
            "nullable": true
          },
          "relatedProcesses": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/RelatedProcess"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ReleasePackage": {
        "type": "object",
        "properties": {
          "uri": {
            "type": "string",
            "nullable": true
          },
          "version": {
            "type": "string",
            "nullable": true
          },
          "publishedDate": {
            "type": "string",
            "nullable": true
          },
          "publisher": {
            "$ref": "#/components/schemas/Publisher"
          },
          "license": {
            "type": "string",
            "nullable": true
          },
          "publicationPolicy": {
            "type": "string",
            "nullable": true
          },
          "releases": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Release"
            },
            "nullable": true
          },
          "links": {
            "$ref": "#/components/schemas/Link"
          }
        },
        "additionalProperties": false
      },
      "Renewal": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "SelectionCriteria": {
        "type": "object",
        "properties": {
          "criteria": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Criterion"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "SubmissionTerms": {
        "type": "object",
        "properties": {
          "variantPolicy": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Supplier": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "name": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Techniques": {
        "type": "object",
        "properties": {
          "hasFrameworkAgreement": {
            "type": "boolean"
          },
          "frameworkAgreement": {
            "$ref": "#/components/schemas/FrameworkAgreement"
          },
          "hasElectronicAuction": {
            "type": "boolean"
          },
          "electronicAuction": {
            "$ref": "#/components/schemas/ElectronicAuction"
          }
        },
        "additionalProperties": false
      },
      "Tender": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "string",
            "nullable": true
          },
          "mainProcurementCategory": {
            "type": "string",
            "nullable": true
          },
          "additionalProcurementCategories": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "reviewDetails": {
            "type": "string",
            "nullable": true
          },
          "hasEnquiries": {
            "type": "boolean",
            "nullable": true
          },
          "eligibilityCriteria": {
            "type": "string",
            "nullable": true
          },
          "submissionMethod": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "submissionMethodDetails": {
            "type": "string",
            "nullable": true
          },
          "classification": {
            "$ref": "#/components/schemas/Classification"
          },
          "value": {
            "$ref": "#/components/schemas/Value"
          },
          "lots": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Lot"
            },
            "nullable": true
          },
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/TenderItem"
            },
            "nullable": true
          },
          "communication": {
            "$ref": "#/components/schemas/Communication"
          },
          "selectionCriteria": {
            "$ref": "#/components/schemas/SelectionCriteria"
          },
          "documents": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Document"
            },
            "nullable": true
          },
          "otherRequirements": {
            "$ref": "#/components/schemas/OtherRequirements"
          },
          "contractTerms": {
            "$ref": "#/components/schemas/ContractTerms"
          },
          "techniques": {
            "$ref": "#/components/schemas/Techniques"
          },
          "coveredBy": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "awardPeriod": {
            "$ref": "#/components/schemas/AwardPeriod"
          },
          "tenderPeriod": {
            "$ref": "#/components/schemas/TenderPeriod"
          },
          "enquiryPeriod": {
            "$ref": "#/components/schemas/EnquiryPeriod"
          },
          "legalBasis": {
            "$ref": "#/components/schemas/LegalBasis"
          },
          "contractPeriod": {
            "$ref": "#/components/schemas/TenderContractPeriod"
          },
          "tenderers": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Tenderers"
            },
            "nullable": true
          },
          "procuringEntity": {
            "$ref": "#/components/schemas/ProcuringEntity"
          },
          "procurementMethod": {
            "type": "string",
            "nullable": true
          },
          "procurementMethodDetails": {
            "type": "string",
            "nullable": true
          },
          "briefingSession": {
            "$ref": "#/components/schemas/BriefingSession"
          },
          "contactPerson": {
            "$ref": "#/components/schemas/ContactPerson"
          }
        },
        "additionalProperties": false
      },
      "TenderContractPeriod": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "format": "date-time",
            "nullable": true
          },
          "endDate": {
            "type": "string",
            "format": "date-time",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Tenderers": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "nullable": true
          },
          "id": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "TenderItem": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "description": {
            "type": "string",
            "nullable": true
          },
          "classification": {
            "type": "string",
            "nullable": true
          },
          "classifications": {
            "$ref": "#/components/schemas/Classification"
          },
          "quantity": {
            "type": "integer",
            "format": "int32"
          },
          "unit": {
            "type": "string",
            "nullable": true
          },
          "itemid": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "TenderPeriod": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "nullable": true
          },
          "endDate": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "TransactionInformation": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "nullable": true
          },
          "source": {
            "type": "string",
            "nullable": true
          },
          "date": {
            "type": "string",
            "nullable": true
          },
          "value": {
            "$ref": "#/components/schemas/Value"
          },
          "uri": {
            "type": "string",
            "nullable": true
          },
          "payer": {
            "$ref": "#/components/schemas/OrganisationReference"
          },
          "payee": {
            "$ref": "#/components/schemas/OrganisationReference"
          }
        },
        "additionalProperties": false
      },
      "Value": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "number",
            "format": "double"
          },
          "currency": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      }
    }
  }
}
