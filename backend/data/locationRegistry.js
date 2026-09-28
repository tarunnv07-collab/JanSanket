/**
 * JANSANKET — Comprehensive Indian States & Districts Registry
 * Includes State Codes, District Codes, and official district mappings for 28 States & 8 UTs.
 */

const STATE_DISTRICT_MAP = {
    "AP": {
        code: "AP",
        name: "Andhra Pradesh",
        type: "State",
        districts: [
            { code: "AP_ANT", name: "Anantapur" },
            { code: "AP_CTR", name: "Chittoor" },
            { code: "AP_EGD", name: "East Godavari" },
            { code: "AP_GNT", name: "Guntur" },
            { code: "AP_KRN", name: "Kurnool" },
            { code: "AP_NLR", name: "Nellore" },
            { code: "AP_PKS", name: "Prakasam" },
            { code: "AP_SKL", name: "Srikakulam" },
            { code: "AP_VSP", name: "Visakhapatnam" },
            { code: "AP_VZN", name: "Vizianagaram" },
            { code: "AP_WGD", name: "West Godavari" },
            { code: "AP_YSR", name: "YSR Kadapa" },
            { code: "AP_KRN2", name: "Nandyal" },
            { code: "AP_NTR", name: "NTR" },
            { code: "AP_VJY", name: "Vijayawada" },
            { code: "AP_TPT", name: "Tirupati" }
        ]
    },
    "AR": {
        code: "AR",
        name: "Arunachal Pradesh",
        type: "State",
        districts: [
            { code: "AR_ITN", name: "Itanagar Capital Complex" },
            { code: "AR_TNG", name: "Tawang" },
            { code: "AR_WKM", name: "West Kameng" },
            { code: "AR_EKM", name: "East Kameng" },
            { code: "AR_PAP", name: "Papum Pare" },
            { code: "AR_LSB", name: "Lower Subansiri" },
            { code: "AR_USB", name: "Upper Subansiri" },
            { code: "AR_WSG", name: "West Siang" },
            { code: "AR_ESG", name: "East Siang" },
            { code: "AR_LHD", name: "Lohit" },
            { code: "AR_CHG", name: "Changlang" },
            { code: "AR_TRP", name: "Tirap" }
        ]
    },
    "AS": {
        code: "AS",
        name: "Assam",
        type: "State",
        districts: [
            { code: "AS_GHY", name: "Kamrup Metropolitan (Guwahati)" },
            { code: "AS_KMP", name: "Kamrup" },
            { code: "AS_DHR", name: "Dhubri" },
            { code: "AS_GOL", name: "Goalpara" },
            { code: "AS_BAR", name: "Barpeta" },
            { code: "AS_NAL", name: "Nalbari" },
            { code: "AS_KOK", name: "Kokrajhar" },
            { code: "AS_DAR", name: "Darrang" },
            { code: "AS_SON", name: "Sonitpur" },
            { code: "AS_LAK", name: "Lakhimpur" },
            { code: "AS_DHE", name: "Dhemaji" },
            { code: "AS_JOR", name: "Jorhat" },
            { code: "AS_SIB", name: "Sivasagar" },
            { code: "AS_DIB", name: "Dibrugarh" },
            { code: "AS_TIN", name: "Tinsukia" },
            { code: "AS_NAG", name: "Nagaon" },
            { code: "AS_CACH", name: "Cachar (Silchar)" }
        ]
    },
    "BR": {
        code: "BR",
        name: "Bihar",
        type: "State",
        districts: [
            { code: "BR_PAT", name: "Patna" },
            { code: "BR_GAY", name: "Gaya" },
            { code: "BR_MUZ", name: "Muzaffarpur" },
            { code: "BR_BHG", name: "Bhagalpur" },
            { code: "BR_DAR", name: "Darbhanga" },
            { code: "BR_PUR", name: "Purnia" },
            { code: "BR_ROH", name: "Rohtas" },
            { code: "BR_SAR", name: "Saran" },
            { code: "BR_SAM", name: "Samastipur" },
            { code: "BR_BEG", name: "Begusarai" },
            { code: "BR_VAL", name: "Vaishali" },
            { code: "BR_NAL", name: "Nalanda" },
            { code: "BR_AUR", name: "Aurangabad" }
        ]
    },
    "CG": {
        code: "CG",
        name: "Chhattisgarh",
        type: "State",
        districts: [
            { code: "CG_RPR", name: "Raipur" },
            { code: "CG_BSP", name: "Bilaspur" },
            { code: "CG_DURG", name: "Durg" },
            { code: "CG_RJN", name: "Rajnandgaon" },
            { code: "CG_KRB", name: "Korba" },
            { code: "CG_RGD", name: "Raigarh" },
            { code: "CG_JGD", name: "Jagdalpur (Bastar)" },
            { code: "CG_AMB", name: "Ambikapur (Surguja)" },
            { code: "CG_KMR", name: "Kabirdham (Kawardha)" },
            { code: "CG_DHMT", name: "Dhamtari" }
        ]
    },
    "GA": {
        code: "GA",
        name: "Goa",
        type: "State",
        districts: [
            { code: "GA_NGOA", name: "North Goa (Panaji)" },
            { code: "GA_SGOA", name: "South Goa (Margao)" }
        ]
    },
    "GJ": {
        code: "GJ",
        name: "Gujarat",
        type: "State",
        districts: [
            { code: "GJ_AMD", name: "Ahmedabad" },
            { code: "GJ_SUR", name: "Surat" },
            { code: "GJ_VAD", name: "Vadodara" },
            { code: "GJ_RJK", name: "Rajkot" },
            { code: "GJ_BHA", name: "Bhavnagar" },
            { code: "GJ_JAM", name: "Jamnagar" },
            { code: "GJ_GND", name: "Gandhinagar" },
            { code: "GJ_JUN", name: "Junagadh" },
            { code: "GJ_ANND", name: "Anand" },
            { code: "GJ_KCH", name: "Kutch" },
            { code: "GJ_VAL", name: "Valsad" },
            { code: "GJ_MEH", name: "Mehsana" },
            { code: "GJ_BHCH", name: "Bharuch" }
        ]
    },
    "HR": {
        code: "HR",
        name: "Haryana",
        type: "State",
        districts: [
            { code: "HR_GUR", name: "Gurugram" },
            { code: "HR_FAR", name: "Faridabad" },
            { code: "HR_PAN", name: "Panipat" },
            { code: "HR_AMB", name: "Ambala" },
            { code: "HR_HIS", name: "Hisar" },
            { code: "HR_KAR", name: "Karnal" },
            { code: "HR_ROH", name: "Rohtak" },
            { code: "HR_SON", name: "Sonipat" },
            { code: "HR_PCH", name: "Panchkula" },
            { code: "HR_JHA", name: "Jhajjar" },
            { code: "HR_REW", name: "Rewari" },
            { code: "HR_YAM", name: "Yamunanagar" }
        ]
    },
    "HP": {
        code: "HP",
        name: "Himachal Pradesh",
        type: "State",
        districts: [
            { code: "HP_SML", name: "Shimla" },
            { code: "HP_KNG", name: "Kangra (Dharamshala)" },
            { code: "HP_MND", name: "Mandi" },
            { code: "HP_SOL", name: "Solan" },
            { code: "HP_KLU", name: "Kullu" },
            { code: "HP_HAM", name: "Hamirpur" },
            { code: "HP_UNA", name: "Una" },
            { code: "HP_CHM", name: "Chamba" },
            { code: "HP_SIR", name: "Sirmaur" },
            { code: "HP_BIL", name: "Bilaspur" },
            { code: "HP_LSP", name: "Lahaul and Spiti" },
            { code: "HP_KIN", name: "Kinnaur" }
        ]
    },
    "JH": {
        code: "JH",
        name: "Jharkhand",
        type: "State",
        districts: [
            { code: "JH_RNC", name: "Ranchi" },
            { code: "JH_DNB", name: "Dhanbad" },
            { code: "JH_JSR", name: "East Singhbhum (Jamshedpur)" },
            { code: "JH_BOK", name: "Bokaro" },
            { code: "JH_HZB", name: "Hazaribagh" },
            { code: "JH_DEV", name: "Deoghar" },
            { code: "JH_DMK", name: "Dumka" },
            { code: "JH_WSI", name: "West Singhbhum" },
            { code: "JH_GRD", name: "Giridih" },
            { code: "JH_PAL", name: "Palamu" }
        ]
    },
    "KA": {
        code: "KA",
        name: "Karnataka",
        type: "State",
        districts: [
            { code: "KA_BLRU", name: "Bengaluru Urban" },
            { code: "KA_BLRR", name: "Bengaluru Rural" },
            { code: "KA_MYS", name: "Mysuru" },
            { code: "KA_DKN", name: "Dakshina Kannada (Mangaluru)" },
            { code: "KA_BLG", name: "Belagavi" },
            { code: "KA_DHW", name: "Dharwad (Hubballi-Dharwad)" },
            { code: "KA_CKM", name: "Chikkamagaluru" },
            { code: "KA_UDU", name: "Udupi" },
            { code: "KA_SHW", name: "Shivamogga" },
            { code: "KA_TUM", name: "Tumakuru" },
            { code: "KA_HSN", name: "Hassan" },
            { code: "KA_DVG", name: "Davanagere" },
            { code: "KA_BLL", name: "Ballari" },
            { code: "KA_KLG", name: "Kalaburagi (Gulbarga)" },
            { code: "KA_KLR", name: "Kolar" },
            { code: "KA_KDG", name: "Kodagu (Madikeri)" },
            { code: "KA_RCH", name: "Raichur" },
            { code: "KA_BJP", name: "Vijayapura (Bijapur)" },
            { code: "KA_UKN", name: "Uttara Kannada (Karwar)" },
            { code: "KA_MND", name: "Mandya" },
            { code: "KA_BAG", name: "Bagalkote" },
            { code: "KA_BID", name: "Bidar" },
            { code: "KA_CHM", name: "Chamarajanagara" },
            { code: "KA_CDB", name: "Chikkaballapura" },
            { code: "KA_CTA", name: "Chitradurga" },
            { code: "KA_GDG", name: "Gadag" },
            { code: "KA_HVR", name: "Haveri" },
            { code: "KA_KPL", name: "Koppal" },
            { code: "KA_RMN", name: "Ramanagara" },
            { code: "KA_YDG", name: "Yadgir" },
            { code: "KA_VJN", name: "Vijayanagara" }
        ]
    },
    "KL": {
        code: "KL",
        name: "Kerala",
        type: "State",
        districts: [
            { code: "KL_TVM", name: "Thiruvananthapuram" },
            { code: "KL_EKM", name: "Ernakulam (Kochi)" },
            { code: "KL_KKD", name: "Kozhikode" },
            { code: "KL_TCR", name: "Thrissur" },
            { code: "KL_PLK", name: "Palakkad" },
            { code: "KL_MLP", name: "Malappuram" },
            { code: "KL_KNR", name: "Kannur" },
            { code: "KL_KTY", name: "Kottayam" },
            { code: "KL_KLM", name: "Kollam" },
            { code: "KL_ALP", name: "Alappuzha" },
            { code: "KL_WYD", name: "Wayanad" },
            { code: "KL_IDK", name: "Idukki" },
            { code: "KL_PTA", name: "Pathanamthitta" },
            { code: "KL_KSD", name: "Kasaragod" }
        ]
    },
    "MP": {
        code: "MP",
        name: "Madhya Pradesh",
        type: "State",
        districts: [
            { code: "MP_BPL", name: "Bhopal" },
            { code: "MP_IND", name: "Indore" },
            { code: "MP_JBP", name: "Jabalpur" },
            { code: "MP_GWL", name: "Gwalior" },
            { code: "MP_UJN", name: "Ujjain" },
            { code: "MP_SAG", name: "Sagar" },
            { code: "MP_REW", name: "Rewa" },
            { code: "MP_SAT", name: "Satna" },
            { code: "MP_RAT", name: "Ratlam" },
            { code: "MP_DEW", name: "Dewas" }
        ]
    },
    "MH": {
        code: "MH",
        name: "Maharashtra",
        type: "State",
        districts: [
            { code: "MH_MBC", name: "Mumbai City" },
            { code: "MH_MBS", name: "Mumbai Suburban" },
            { code: "MH_PUN", name: "Pune" },
            { code: "MH_NGP", name: "Nagpur" },
            { code: "MH_NSK", name: "Nashik" },
            { code: "MH_THN", name: "Thane" },
            { code: "MH_PLG", name: "Palghar" },
            { code: "MH_CSN", name: "Chhatrapati Sambhajinagar (Aurangabad)" },
            { code: "MH_SOL", name: "Solapur" },
            { code: "MH_KOL", name: "Kolhapur" },
            { code: "MH_AMR", name: "Amravati" },
            { code: "MH_NND", name: "Nanded" },
            { code: "MH_SAT", name: "Satara" },
            { code: "MH_RGD", name: "Raigad" },
            { code: "MH_AHM", name: "Ahilyanagar (Ahmednagar)" },
            { code: "MH_JAL", name: "Jalgaon" },
            { code: "MH_SNG", name: "Sangli" },
            { code: "MH_RAT", name: "Ratnagiri" },
            { code: "MH_LAT", name: "Latur" },
            { code: "MH_DUL", name: "Dhule" }
        ]
    },
    "MN": {
        code: "MN",
        name: "Manipur",
        type: "State",
        districts: [
            { code: "MN_IME", name: "Imphal East" },
            { code: "MN_IMW", name: "Imphal West" },
            { code: "MN_THB", name: "Thoubal" },
            { code: "MN_BPR", name: "Bishnupur" },
            { code: "MN_CCP", name: "Churachandpur" },
            { code: "MN_UKH", name: "Ukhrul" }
        ]
    },
    "ML": {
        code: "ML",
        name: "Meghalaya",
        type: "State",
        districts: [
            { code: "ML_SHL", name: "East Khasi Hills (Shillong)" },
            { code: "ML_WKH", name: "West Khasi Hills" },
            { code: "ML_RIB", name: "Ri-Bhoi" },
            { code: "ML_WJH", name: "West Jaintia Hills" },
            { code: "ML_EJH", name: "East Jaintia Hills" },
            { code: "ML_WGH", name: "West Garo Hills (Tura)" }
        ]
    },
    "MZ": {
        code: "MZ",
        name: "Mizoram",
        type: "State",
        districts: [
            { code: "MZ_AIZ", name: "Aizawl" },
            { code: "MZ_LUN", name: "Lunglei" },
            { code: "MZ_CHM", name: "Champhai" },
            { code: "MZ_SER", name: "Serchhip" },
            { code: "MZ_KOL", name: "Kolasib" }
        ]
    },
    "NL": {
        code: "NL",
        name: "Nagaland",
        type: "State",
        districts: [
            { code: "NL_KOH", name: "Kohima" },
            { code: "NL_DIM", name: "Dimapur" },
            { code: "NL_MOK", name: "Mokokchung" },
            { code: "NL_WOK", name: "Wokha" },
            { code: "NL_TUE", name: "Tuensang" },
            { code: "NL_MON", name: "Mon" }
        ]
    },
    "OD": {
        code: "OD",
        name: "Odisha",
        type: "State",
        districts: [
            { code: "OD_KHD", name: "Khurda (Bhubaneswar)" },
            { code: "OD_CTC", name: "Cuttack" },
            { code: "OD_GJM", name: "Ganjam (Berhampur)" },
            { code: "OD_PUR", name: "Puri" },
            { code: "OD_SND", name: "Sundargarh (Rourkela)" },
            { code: "OD_SMB", name: "Sambalpur" },
            { code: "OD_BLS", name: "Balasore" },
            { code: "OD_MAY", name: "Mayurbhanj" },
            { code: "OD_KRN", name: "Koraput" }
        ]
    },
    "PB": {
        code: "PB",
        name: "Punjab",
        type: "State",
        districts: [
            { code: "PB_LUD", name: "Ludhiana" },
            { code: "PB_ASR", name: "Amritsar" },
            { code: "PB_JAL", name: "Jalandhar" },
            { code: "PB_PAT", name: "Patiala" },
            { code: "PB_SAS", name: "SAS Nagar (Mohali)" },
            { code: "PB_BTH", name: "Bathinda" },
            { code: "PB_HOS", name: "Hoshiarpur" },
            { code: "PB_GUR", name: "Gurdaspur" },
            { code: "PB_SNG", name: "Sangrur" }
        ]
    },
    "RJ": {
        code: "RJ",
        name: "Rajasthan",
        type: "State",
        districts: [
            { code: "RJ_JPR", name: "Jaipur" },
            { code: "RJ_JOD", name: "Jodhpur" },
            { code: "RJ_KTA", name: "Kota" },
            { code: "RJ_UDP", name: "Udaipur" },
            { code: "RJ_AJM", name: "Ajmer" },
            { code: "RJ_BIK", name: "Bikaner" },
            { code: "RJ_ALW", name: "Alwar" },
            { code: "RJ_BHW", name: "Bhilwara" },
            { code: "RJ_BRP", name: "Bharatpur" },
            { code: "RJ_SIK", name: "Sikar" }
        ]
    },
    "SK": {
        code: "SK",
        name: "Sikkim",
        type: "State",
        districts: [
            { code: "SK_GKT", name: "Gangtok (East Sikkim)" },
            { code: "SK_NAM", name: "Namchi (South Sikkim)" },
            { code: "SK_GYA", name: "Gyalshing (West Sikkim)" },
            { code: "SK_MNG", name: "Mangan (North Sikkim)" },
            { code: "SK_PAK", name: "Pakyong" },
            { code: "SK_SOR", name: "Soreng" }
        ]
    },
    "TN": {
        code: "TN",
        name: "Tamil Nadu",
        type: "State",
        districts: [
            { code: "TN_CHN", name: "Chennai" },
            { code: "TN_CBE", name: "Coimbatore" },
            { code: "TN_MDU", name: "Madurai" },
            { code: "TN_TPJ", name: "Tiruchirappalli" },
            { code: "TN_SLM", name: "Salem" },
            { code: "TN_TUP", name: "Tiruppur" },
            { code: "TN_VEL", name: "Vellore" },
            { code: "TN_ERD", name: "Erode" },
            { code: "TN_TNV", name: "Tirunelveli" },
            { code: "TN_KNG", name: "Kanchipuram" },
            { code: "TN_CGL", name: "Chengalpattu" },
            { code: "TN_KKI", name: "Kanyakumari" }
        ]
    },
    "TS": {
        code: "TS",
        name: "Telangana",
        type: "State",
        districts: [
            { code: "TS_HYD", name: "Hyderabad" },
            { code: "TS_RR", name: "Ranga Reddy" },
            { code: "TS_MED", name: "Medchal-Malkajgiri" },
            { code: "TS_WGL", name: "Warangal" },
            { code: "TS_KHM", name: "Khammam" },
            { code: "TS_KAR", name: "Karimnagar" },
            { code: "TS_NZB", name: "Nizamabad" },
            { code: "TS_NLG", name: "Nalgonda" },
            { code: "TS_MBN", name: "Mahabubnagar" }
        ]
    },
    "TR": {
        code: "TR",
        name: "Tripura",
        type: "State",
        districts: [
            { code: "TR_AGT", name: "West Tripura (Agartala)" },
            { code: "TR_GMT", name: "Gomati" },
            { code: "TR_DHA", name: "Dhalai" },
            { code: "TR_NTR", name: "North Tripura" },
            { code: "TR_STR", name: "South Tripura" },
            { code: "TR_UNK", name: "Unakoti" }
        ]
    },
    "UP": {
        code: "UP",
        name: "Uttar Pradesh",
        type: "State",
        districts: [
            { code: "UP_LKO", name: "Lucknow" },
            { code: "UP_KNP", name: "Kanpur Nagar" },
            { code: "UP_VNS", name: "Varanasi" },
            { code: "UP_AGR", name: "Agra" },
            { code: "UP_PRG", name: "Prayagraj (Allahabad)" },
            { code: "UP_GBN", name: "Gautam Buddha Nagar (Noida)" },
            { code: "UP_GZB", name: "Ghaziabad" },
            { code: "UP_MTR", name: "Mathura" },
            { code: "UP_MRT", name: "Meerut" },
            { code: "UP_GRP", name: "Gorakhpur" },
            { code: "UP_AYD", name: "Ayodhya" },
            { code: "UP_BLY", name: "Bareilly" },
            { code: "UP_ALg", name: "Aligarh" },
            { code: "UP_MBD", name: "Moradabad" }
        ]
    },
    "UK": {
        code: "UK",
        name: "Uttarakhand",
        type: "State",
        districts: [
            { code: "UK_DDN", name: "Dehradun" },
            { code: "UK_HRD", name: "Haridwar" },
            { code: "UK_NTL", name: "Nainital" },
            { code: "UK_USN", name: "Udham Singh Nagar" },
            { code: "UK_PLI", name: "Pauri Garhwal" },
            { code: "UK_ALM", name: "Almora" },
            { code: "UK_TIR", name: "Tehri Garhwal" },
            { code: "UK_PTH", name: "Pithoragarh" }
        ]
    },
    "WB": {
        code: "WB",
        name: "West Bengal",
        type: "State",
        districts: [
            { code: "WB_KOL", name: "Kolkata" },
            { code: "WB_HWR", name: "Howrah" },
            { code: "WB_N24", name: "North 24 Parganas" },
            { code: "WB_S24", name: "South 24 Parganas" },
            { code: "WB_HGL", name: "Hooghly" },
            { code: "WB_PAS", name: "Paschim Medinipur" },
            { code: "WB_PUR", name: "Purba Medinipur" },
            { code: "WB_DAR", name: "Darjeeling" },
            { code: "WB_JLP", name: "Jalpaiguri" },
            { code: "WB_MUR", name: "Murshidabad" },
            { code: "WB_NAD", name: "Nadia" },
            { code: "WB_BRD", name: "Paschim Bardhaman" }
        ]
    },
    // ── Union Territories ───────────────────────────────────────────────────
    "AN": {
        code: "AN",
        name: "Andaman and Nicobar Islands",
        type: "Union Territory",
        districts: [
            { code: "AN_SND", name: "South Andaman (Port Blair)" },
            { code: "AN_NMD", name: "North and Middle Andaman" },
            { code: "AN_NIC", name: "Nicobar" }
        ]
    },
    "CH": {
        code: "CH",
        name: "Chandigarh",
        type: "Union Territory",
        districts: [
            { code: "CH_CHD", name: "Chandigarh" }
        ]
    },
    "DN": {
        code: "DN",
        name: "Dadra and Nagar Haveli and Daman and Diu",
        type: "Union Territory",
        districts: [
            { code: "DN_DMN", name: "Daman" },
            { code: "DN_DIU", name: "Diu" },
            { code: "DN_DNH", name: "Dadra and Nagar Haveli (Silvassa)" }
        ]
    },
    "DL": {
        code: "DL",
        name: "Delhi",
        type: "Union Territory",
        districts: [
            { code: "DL_NDL", name: "New Delhi" },
            { code: "DL_CDL", name: "Central Delhi" },
            { code: "DL_EDL", name: "East Delhi" },
            { code: "DL_WED", name: "West Delhi" },
            { code: "DL_NDH", name: "North Delhi" },
            { code: "DL_SDH", name: "South Delhi" },
            { code: "DL_SWD", name: "South West Delhi" },
            { code: "DL_NWD", name: "North West Delhi" },
            { code: "DL_NED", name: "North East Delhi" },
            { code: "DL_SHD", name: "Shahdara" }
        ]
    },
    "JK": {
        code: "JK",
        name: "Jammu and Kashmir",
        type: "Union Territory",
        districts: [
            { code: "JK_SGR", name: "Srinagar" },
            { code: "JK_JMU", name: "Jammu" },
            { code: "JK_ANP", name: "Anantnag" },
            { code: "JK_BAM", name: "Baramulla" },
            { code: "JK_UHD", name: "Udhampur" },
            { code: "JK_KTH", name: "Kathua" },
            { code: "JK_BUD", name: "Budgam" },
            { code: "JK_PUL", name: "Pulwama" }
        ]
    },
    "LA": {
        code: "LA",
        name: "Ladakh",
        type: "Union Territory",
        districts: [
            { code: "LA_LEH", name: "Leh" },
            { code: "LA_KRG", name: "Kargil" }
        ]
    },
    "LD": {
        code: "LD",
        name: "Lakshadweep",
        type: "Union Territory",
        districts: [
            { code: "LD_KVR", name: "Kavaratti" }
        ]
    },
    "PY": {
        code: "PY",
        name: "Puducherry",
        type: "Union Territory",
        districts: [
            { code: "PY_PUD", name: "Puducherry" },
            { code: "PY_KKL", name: "Karaikal" },
            { code: "PY_MHE", name: "Mahe" },
            { code: "PY_YAM", name: "Yanam" }
        ]
    }
};

module.exports = { STATE_DISTRICT_MAP };
