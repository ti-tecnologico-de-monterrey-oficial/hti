/*******************************************************************************
 * \note Copyright\n This file is part of ADOxx Web.\n (C) COPYRIGHT BOC -
 * Business Objectives Consulting 1995 - 2011\n All Rights Reserved\n Use,
 * duplication or disclosure restricted by BOC Information Systems\n Vienna,
 * 1995 - 2011
 * ********************************************************************* \author
 * MWH, RPa This file contains varants that are used by most ADOit scripts
 * and components. It should be included by every dialog and every overlay.
 * *********************************************************************
 */

// ################################################################################################################
// The following varants hold the language indpendent names of attributes that
// are used
// regularly by the various scripts in ADOit.
// ################################################################################################################
// The name of a model, a modelling instance or a repository instance
var ATTR_NAME = "NAME";
// The attribute "VALID_FROM"
var ATTR_VALID_FROM = "VALID_FROM";
// The attribute "VALID_UNTIL"
var ATTR_VALID_UNTIL = "VALID_UNTIL";
// The attribute "START_DATE"
var ATTR_START_DATE = "START_DATE";
// The attribute "END_DATE"
var ATTR_END_DATE = "END_DATE";
// The attribute "ICON_CLASS"
var ATTR_ICON_CLASS = "ICON_CLASS";
// The attribute "STATUS"
var ATTR_STATUS = "STATUS";
// The attribute "GRIDENABLED"
var ATTR_GRIDENABLED = "GRIDENABLED";
// The attribute "POSY"
var ATTR_POSY = "POSY";
// The attribute "POSX"
var ATTR_POSX = "POSX";
// The attribute "HEIGHT"
var ATTR_HEIGHT = "HEIGHT";
// The attribute "WIDTH"
var ATTR_WIDTH = "WIDTH";
// The attribute "COLOUR"
var ATTR_COLOUR = "COLOUR";
// The attribute "REPRESENTATION"
var ATTR_REPRESENTATION = "REPRESENTATION";
// The attribute "IS_DEFAULT_SCENARIO"
var ATTR_IS_DEFAULT_SCENARIO = "IS_DEFAULT_SCENARIO";
// The attribute "VISIBLE IN CATALOGUE"
var ATTR_VISIBLE_IN_CATALOG = "VISIBLE_IN_CATALOGUE";

// ################################################################################################################
// The following varants hold the language indpendent names of endpoints
// ################################################################################################################
// The "TO"-Endpoint
var EP_TO = "TO";
// The "FROM"-Endpoint
var EP_FROM = "FROM";

// ################################################################################################################
// The following varants hold the language indpendent names of modeltypes,
// classes and relation classes that
// are hardcoded in ADOit (for the moment)
// ################################################################################################################
// The modeltype MT_BUSINESS_IMPACT_ANALYSIS
var MT_BUSINESS_IMPACT_ANALYSIS = "MT_BUSINESS_IMPACT_ANALYSIS";
// The class C_SCENARIO that is used to represent planning scenarios
var C_SCENARIO = "C_SCENARIO";
// The class C_LEVEL_HORIZONTAL used in the BIA to represent a layer
var C_LEVEL_HORIZONTAL = "C_LEVEL_HORIZONTAL";
// The class C_BLOCK
var C_BLOCK = "C_BLOCK";
// The class C_PROJECT used in the BIA to represent a layer
var C_PROJECT = "C_PROJECT";
// The relation class RC_IS_PART_OF_SCENARIO that is used to create the scenario
// affiliation of a diagram or an instance
var RC_IS_PART_OF_SCENARIO = "RC_IS_PART_OF_SCENARIO";
// The relation class RC_CONNECTOR that is used to visualize relations in the
// BIA
var RC_CONNECTOR = "RC_CONNECTOR";
// The relation IS_INSIDE, used in container objects
var RC_IS_INSIDE = "IS_INSIDE";

// ################################################################################################################
// The following varants hold the possible values for the STATUS-attribute used
// in the release workflow.
// ################################################################################################################
// The status DRAFT
var STATUS_DRAFT = "v0";
// The status AUDIT
var STATUS_AUDIT = "v1";
// The status RELEASED
var STATUS_RELEASED = "v2";
// The status ARCHIVED
var STATUS_ARCHIVED = "v3";

// ################################################################################################################
// The following varants hold the possible values for the
// REPRESENTATION-attribute.
// ################################################################################################################
// Inside
var REPRESENTATION_INSIDE = "v1";
// Outside
var REPRESENTATION_OUTSIDE = "v0";

// ################################################################################################################
// The following varants hold the language indpendent names of attribute types
// that are used
// regularly by the various scripts in ADOit.
// ################################################################################################################
var ATTR_TYPE_STRING = "STRING";
var ATTR_TYPE_ADOSTRING = "ADOSTRING";
var ATTR_TYPE_LONGSTRING = "LONGSTRING";
var ATTR_TYPE_SHORTSTRING = "SHORTSTRING";
var ATTR_TYPE_BOOL = "BOOL";
var ATTR_TYPE_INTEGER = "INTEGER";
var ATTR_TYPE_DOUBLE = "DOUBLE";
var ATTR_TYPE_FILE_POINTER = "FILE_POINTER";
var ATTR_DATE = "DATE";
var ATTR_TYPE_ENUM = "ENUM";
var ATTR_TYPE_ENUMLIST = "ENUMLIST";

// ################################################################################################################
// Language IDs for the various languages in ADOit
// ################################################################################################################
// The ID for the German language
var LANG_ID_GERMAN = "de";
// The ID for the English language
var LANG_ID_ENGLISH = "en";

// ################################################################################################################
// Miscellaneous varants
// ################################################################################################################
// The number of months in a yeard
var MISC_NUMBER_OF_MONTHS_IN_YEAR = 12;
// The preference name for the adoxx ribbon style
var ADOXX_RIBBON_STYLE = "adoxx.use.ribbonstyle.menu";
// The UTF8 encoding
var ENCODING_UTF8 = "UTF-8";
// The UCS2 encoding
var ENCODING_UCS2 = "UCS2";
// The parameter for conversion from decimal to hexadecimal numbers
var HEX = 16;
// Incoming relations
var REL_INCOMING = "incoming";
// Outgoing relations
var REL_OUTGOING = "outgoing";
// The regular expression for an IAdoID
var REG_EXP_IADOID = /\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}/;
// The id that is used to store the current scenario's id in the global
// properties
var CURRENT_SCENARIO_ID = "ait_current_scenario_id";
// The id that is used to store the current scenario relation's id in the global
// properties
var CURRENT_SCENARIO_RELATION_ID = "ait_current_scenario_relation_id";
// The id of the current scenario filter
var CURRENT_SCENARIO_FILTER = "ait_current_scenario_filter";

// ################################################################################################################
// varants for the matrix view generation
// ################################################################################################################

var MATRIX_ICON_URL = "chrome://adoitnp/skin/menu/matrix_16.png";
var GANTT_ICON_URL = "chrome://adoitnp/skin/menu/gantt_16.png";
var PORTFOLIO_ICON_URL = "chrome://adoitnp/skin/menu/portfolio_16.png";

// ################################################################################################################
// varants for view generation
// ################################################################################################################

var PORTFOLIO_BUBBLE_GRAPHREP = "graphRep.pen.color.setColorByRGB (13, 166, 139);"+
    "graphRep.textProp.size = 150;"+
    "graphRep.fillColor.setColorByRGB (161, 210, 197);"+
    "graphRep.fillEllipse(0,0, %BUBBLESIZE%, %BUBBLESIZE%);"+
    "graphRep.textProp.verticalAlignment = graphRep.alignCenter;"+
    "graphRep.textProp.alignment = graphRep.alignCenter;"+
    "graphRep.addAttr(0,%TEXTPOSY%, \"NAME\");";

var VIEW_FONT = "Arial";
var NEW_OBJ_POSX = 1000;
var NEW_OBJ_POSY = 500;

// ################################################################################################################
// varants for the BIA view generation
// ################################################################################################################
// Height of a BIA layer
var BIA_LAYER_HEIGHT = 3000;

var BIA_LAYER_WIDTH = 20000;
// Distance from the left model border after which the first instance of a layer
// is placed
// var BIA_INSTANCE_OFFSETX = 1500;
var BIA_INSTANCE_OFFSETX = 500;
// Distance from the upper model border after which the first instance of a
// layer is placed
var BIA_INSTANCE_OFFSETY = 1500;

// ################################################################################################################
// The following varants identify the type of a messagebox that is called from
// within
// the IAdoBoxes-Interface
// ################################################################################################################
var BOXES_ERROR = 0;
var BOXES_WARNING = 1;
var BOXES_SUCCESS = 2;
var BOXES_INFO = 3;

// ################################################################################################################
// The following varants identify the types of views implemented in ADOit
// ################################################################################################################
var VIEW_PORTFOLIO = "Portfolio";
var VIEW_GANTT = "GANTT";
var VIEW_MATRIX = "Matrix";

// ################################################################################################################
// The following varants are used to indicate sets of users
// They are used for the creation of tasks (the task is then assigned to the
// users indicated by the passed
// varant) or for the setting of rights.
// ################################################################################################################
// indicates the currently logged in user
var AIT_CURRENT_USER = 0;
// indicates all users
var AIT_ALL_USERS = 1;
// indicates all user groups
var AIT_ALL_USER_GROUPS = 2;

var MICROSECONDS_IN_MILLISECOND = 1000;

// max year allowed to store in ADOxx
var MAX_YEAR = 9999;

// ################################################################################################################
// varants for the Views
// ################################################################################################################
// The string representation of the id of the BIA view
// This has to be the same id as the one that is used in
// ait_component_migr_settings_bia.js
var BIA_VIEW_ID = "{542db3a2-d11e-45b0-8aba-2a4357873853}";
// The string representation of the id of the GANTT view
// This has to be the same id as the one that is used in
// ait_component_migr_settings_gantt.js
var GANTT_VIEW_ID = "{e2853d89-299d-498a-8735-04986775d5dc}";
// The string representation of the id of the Portfolio view
// This has to be the same id as the one that is used in
// ait_component_migr_settings_portfolio.js
var PORTFOLIO_VIEW_ID = "{68d914ed-67d6-44a6-a837-17b7873b3ccc}";
// The string representation of the id of the Matrix view
// This has to be the same id as the one that is used in
// ait_component_migr_settings_matrix.js
var MATRIX_VIEW_ID = "{4967241b-458e-496f-99d0-7f78828588a5}";

// ################################################################################################################
// IDs for the migratable settings
// ################################################################################################################
// The string representation of the id of the BIA view
// This has to be the same id as the one that is used in
// ait_component_migr_settings_[class].js
var FILTER_ID = "{c818c9de-8574-43e4-8226-c31d8e3ae9e7}";
var GANTT_SETTINGS_ID = "{40d42dea-14ea-45a6-bd43-588882ec4c28}";
var PORTFOLIO_SETTINGS_ID = "{30efec6e-cc37-43b9-834d-e05601e088a9}";
var BIA_SETTINGS_ID = "{37474140-10b9-46cf-aaa1-fb8be9e231cf}";
var MATRIX_SETTINGS_ID = "{c08dbbd8-4cef-4e7f-a4aa-f49e04b0de21}";
var WEB_ID = "{5DB7EA40-FFAA-4638-80A3-0108E5E781F6}";

// ################################################################################################################
// Fragment IDs for the different migratable settings
// ################################################################################################################
var WEB_MODULE_CONFIG_ID = "{4E9B5D16-D32E-427D-B20F-7F46DC8C4F8B}";
var WEB_FULLTEXTSEARCH_CONFIG_ID = "{9F4A5001-74F5-4E09-9804-28E7B2164AA8}";

// Fragment ids for the settings
var GANTT_SETTINGS_FRAG_ID = "{DF4CD26A-2E65-4C3A-9046-CEC39C6FAE9B}";
var BIA_SETTINGS_FRAG_ID = "{ED102C18-2BDB-4389-B3AF-0C17B56D66DF}";
var PORTFOLIO_SETTINGS_FRAG_ID = "{F6B0FD84-4B5A-4AEE-B309-C1C8BFDD426E}";
var MATRIX_SETTINGS_FRAG_ID = "{B7E464FD-9004-4E7C-B1D8-3EDF64644483}";
var FILTER_SETTINGS_FRAG_ID = "{C8E6C966-3908-47D5-BF16-411AC68AF617}";

// Paths for plugin management
var AIT_DB_PATH = "db:/System/adoitnp/";
var AIT_RES_DB_PATH = AIT_DB_PATH + "res/";
var AIT_CONF_DB_PATH = AIT_RES_DB_PATH + "config/";
var AIT_PLUGIN_PATH = "\\adoitnp\\aserver\\plugins\\";
var AIT_PLUGIN_LOCALE_PATH = "locale";
var AIT_PLUGIN_SETUP_PATH = "setup.js";

// Keys used in the BIA Configuration dialg
var KEY_TAB = 9;
var KEY_LT = 37;
var KEY_UP = 38;
var KEY_RT = 39;
var KEY_DN = 40;
var KEY_DEL = 46;
var KEY_PG_UP = 33;
var KEY_PG_DN = 34;
var KEY_SPACE = 32;

// varants that define artefact types
var AIT_ARTEFACT_OBJECT = 0;
var AIT_ARTEFACT_DIAGRAM = 1;
var AIT_ARTEFACT_OBJECT_GROUP = 2;
var AIT_ARTEFACT_DIAGRAM_GROUP = 3;
var AIT_ARTEFACT_RELATION = 4;
var AIT_ARTEFACT_USER = 5;
var AIT_ARTEFACT_MODINST = 6;
var AIT_ARTEFACT_ENDPOINT = 7;

// Access results
var AIT_ACCESS_RESULT_OK = 0;
var AIT_ACCESS_RESULT_NOT_FOUND = 1;
var AIT_ACCESS_RESULT_LOCKED = 2;
var AIT_ACCESS_RESULT_NOT_IN_DS = 3;
var AIT_ACCESS_RESULT_NOT_DELETABLE = 4;
var AIT_ACCESS_ARTEFACT_REFERENCED = 5;
var AIT_ACCESS_CORE_CLASS_NOT_FOUND = 6;
var AIT_ACCESS_RESULT_UNKNOWN_ERROR = 7;
var AIT_ACCESS_NOT_POSSIBLE = 8;
var AIT_ACCESS_NOT_ALLOWED = 9;

// Access types: read, write delete
var AIT_ACCESS_READ = 0;
var AIT_ACCESS_WRITE = 1;
var AIT_ACCESS_DELETE = 2;

var ATTRIBUTE = "attribute";
var RELATION = "relation";

var AIT_USER_TYPE_STANDARD = "Standard";
var AIT_USER_TYPE_SSO = "SSO";

var AIT_MILLISECONDS_MINUTE = 60000;
var AIT_MILLISECONDS_HOUR = 3600000;
var AIT_MILLISECONDS_DAY = 86400000;
var AIT_MILLISECONDS_WEEK = 604800000;

// Possible values for data actuality in ADOit
var AIT_DATA_ACTUALITY_GREEN = "green";
var AIT_DATA_ACTUALITY_YELLOW = "yellow";
var AIT_DATA_ACTUALITY_RED = "red";

// Possible Time Filter modes
var AIT_FILTER_TYPE_NONE = 0;
var AIT_FILTER_TYPE_UTC_VALUE = 1;
var AIT_FILTER_TYPE_TIME_PERIOD = 2;

// Possible Search Types
var AIT_SEARCH_ARTEFACT_OBJECT = AIT_ARTEFACT_OBJECT;
var AIT_SEARCH_ARTEFACT_DIAGRAM = AIT_ARTEFACT_DIAGRAM;
var AIT_SEARCH_BOTH = 2;

// Regular expression for correct time format
var TIME_REGEX = /([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/;

// Maximum and Minimum values for integers
var MAX_INT = 2147483647;

var MIN_INT = -2147483648;

var MAX_DOUBLE = 999999999999999;
var MIN_DOUBLE = -999999999999999;

var AIT_TEST_CASE_STATE_RUNNING = 0;
var AIT_TEST_CASE_STATE_ERROR = 1;
var AIT_TEST_CASE_STATE_SKIP = 2;
var AIT_TEST_CASE_STATE_FINISHED = 3;
var AIT_TEST_CASE_STATE_FINISHED_ERROR = 4;
var AIT_TEST_CASE_STATE_FINISHED_SKIPPED = 5;

var AIT_DATE_TIME_COMPARISON = "Y.m.d H:i:s";

var AIT_DATE_FORMAT = "d.m.Y";

// The format for time values
var AIT_TIME_FORMAT = "H:i:s";
// The format for datetime for comparing (necessary so that dates serialized as
// strings can be compared)
// (e.g. 2000.01.01 20:01:01)
// The format for date time for representation (e.g. 01.01.2000 20:01:01
var AIT_DATE_TIME_FORMAT = AIT_DATE_FORMAT + " " + AIT_TIME_FORMAT;

// The no value masks for the controls
var AIT_DATE_NOVAL_MASK = "--.--.----";
var AIT_TIME_NOVAL_MASK = "--:--:--";
var AIT_TIMEPERIOD_NOVAL_MASK = "----";

var AIT_LOGIN_MECHANISM_LOCAL = 0;
var AIT_LOGIN_MECHANISM_SSO = 1;

var AIT_RICH_CLIENT = 0;
var AIT_WEB_CLIENT = 1;

var AXW_RESULT_TRUE = 1;
var AXW_RESULT_FALSE = 0;
var AXW_RESULT_PENDING = 2;

var SCROOLBAR_WIDTH = 20;