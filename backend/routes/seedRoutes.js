const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');
const User = require('../models/User');
const LandAssignRequest = require('../models/LandAssignRequest');
const { SHIBGANJ_MOUZAS } = require('../utils/geoData');

// POST /api/seed - Seed land records and legal statuses for Rajshahi > Bogura > Shibganj
// NOTE: No user accounts are seeded. Super Admin is configured via SUPER_ADMIN_EMAIL/PASSWORD env vars.
//       Office users (Register Office, AC Land) must be created by Super Admin from the dashboard.
router.post('/seed', async (req, res) => {
  try {
    await LandRecord.deleteMany({});
    await LegalStatus.deleteMany({});
    await LandAssignRequest.deleteMany({});
    // DO NOT touch User collection — no dummy users

    // Seed Land Records in Rajshahi > Bogura > Shibganj
    const landRecords = [
      {
        record_id: 'record_shib_101',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'গুজিয়া',
        jl_no: '1',
        khatian_no: '25',
        dag_no: '101',
        owner_nid: '1998567890123',
        owner_name: 'রহিম উদ্দিন',
        owner_phone: '01711234567',
        owner_email: 'citizen@example.com',
        total_area_decimal: 18,
        available_area_decimal: 18,
        volume_book: 'VOL-SHIB-2024-A',
        page_no: '12',
        deed_no: 'DEED-SG-0101',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      },
      {
        record_id: 'record_shib_102',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'অনন্তবালা',
        jl_no: '2',
        khatian_no: '48',
        dag_no: '205',
        owner_nid: '2001123456789',
        owner_name: 'করিম সাহেব',
        owner_phone: '01812345678',
        owner_email: 'karim@example.com',
        total_area_decimal: 25,
        available_area_decimal: 25,
        volume_book: 'VOL-SHIB-2023-B',
        page_no: '35',
        deed_no: 'DEED-SG-0205',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      },
      {
        record_id: 'record_shib_103',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'চক অনন্তবালা',
        jl_no: '3',
        khatian_no: '62',
        dag_no: '310',
        owner_nid: '1985999888777',
        owner_name: 'মো. রফিকুল আলম',
        owner_phone: '01711333444',
        owner_email: 'rafiq@example.com',
        total_area_decimal: 14,
        available_area_decimal: 14,
        volume_book: 'VOL-SHIB-2024-C',
        page_no: '77',
        deed_no: 'DEED-SG-0310',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      },
      {
        record_id: 'record_shib_104',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'কিচক',
        jl_no: '4',
        khatian_no: '80',
        dag_no: '412',
        owner_nid: '1992456789012',
        owner_name: 'সালাম মিয়া',
        owner_phone: '01911234567',
        owner_email: 'salam@example.com',
        total_area_decimal: 20,
        available_area_decimal: 20,
        volume_book: 'VOL-SHIB-2026-D',
        page_no: '102',
        deed_no: 'DEED-SG-2026-004',
        deed_year: '2026',
        sub_registry_code: 'SR-BOG-SHIB-01',
        buyer_name: 'নতুন ক্রেতা',
        buyer_nid: '2005111222333',
        buyer_phone: '01711111111',
        buyer_email: 'buyer@example.com',
        status: 'Pending_Mutation' // Double-sell testing
      },
      {
        record_id: 'record_shib_105',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'হরিপুর',
        jl_no: '6',
        khatian_no: '115',
        dag_no: '610',
        owner_nid: '1980555666777',
        owner_name: 'সরকারি খাস জমি রেকর্ড',
        owner_phone: '01711444555',
        owner_email: 'khas@evhumi.gov.bd',
        total_area_decimal: 50,
        available_area_decimal: 50,
        volume_book: 'VOL-KHAS-01',
        page_no: '01',
        deed_no: 'DEED-KHAS-610',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      },
      {
        record_id: 'record_shib_106',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'জানগ্রাম',
        jl_no: '11',
        khatian_no: '230',
        dag_no: '1105',
        owner_nid: '1978333444555',
        owner_name: 'জাহান আরা',
        owner_phone: '01511234567',
        owner_email: 'jahana@example.com',
        total_area_decimal: 10,
        available_area_decimal: 10,
        volume_book: 'VOL-SHIB-2022-F',
        page_no: '88',
        deed_no: 'DEED-SG-1105',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      },
      {
        record_id: 'record_shib_107',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'চণ্ডীহারা',
        jl_no: '15',
        khatian_no: '310',
        dag_no: '1502',
        owner_nid: '1988112233445',
        owner_name: 'মো. তারেক রহমান',
        owner_phone: '01711778899',
        owner_email: 'tarek@example.com',
        total_area_decimal: 30,
        available_area_decimal: 30,
        volume_book: 'VOL-SHIB-2025-G',
        page_no: '45',
        deed_no: 'DEED-SG-1502',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      },
      {
        record_id: 'record_shib_108',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'বুড়িগঞ্জ',
        jl_no: '19',
        khatian_no: '420',
        dag_no: '1908',
        owner_nid: '1995667788990',
        owner_name: 'মোসা. খাদিজা খাতুন',
        owner_phone: '01811667788',
        owner_email: 'khadija@example.com',
        total_area_decimal: 22,
        available_area_decimal: 22,
        volume_book: 'VOL-SHIB-2024-H',
        page_no: '60',
        deed_no: 'DEED-SG-1908',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      },
      {
        record_id: 'record_shib_109',
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        mouza: 'সাদুল্লাপুর',
        jl_no: '20',
        khatian_no: '505',
        dag_no: '2015',
        owner_nid: '1980334455667',
        owner_name: 'মো. শফিকুল ইসলাম',
        owner_phone: '01911998877',
        owner_email: 'shafiq@example.com',
        total_area_decimal: 14,
        available_area_decimal: 14,
        volume_book: 'VOL-SHIB-2025-I',
        page_no: '95',
        deed_no: 'DEED-SG-2015',
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      }
    ];

    const insertedLands = await LandRecord.insertMany(landRecords);

    // 3. Seed Legal Statuses (Khas & Court case in Shibganj, Bogura)
    const legalStatuses = [
      {
        dag_no: '610',
        mouza: 'হরিপুর',
        jl_no: '6',
        is_khas: true,
        has_court_case: false,
        khas_reason: 'সরকারি ১নং খাস খতিয়ানভুক্ত কৃষি জমি - শিবগঞ্জ, বগুড়া',
        stay_order: false
      },
      {
        dag_no: '1105',
        mouza: 'জানগ্রাম',
        jl_no: '11',
        is_khas: false,
        has_court_case: true,
        case_details: 'দেওয়ানি মোকদ্দমা নং ৪৫/২০২৫, বিচারাধীন - শিবগঞ্জ সিনিয়র সহকারী জজ আদালত, বগুড়া',
        stay_order: true
      }
    ];

    await LegalStatus.insertMany(legalStatuses);

    return res.status(200).json({
      success: true,
      message: '✅ রাজশাহী > বগুড়া > শিবগঞ্জ ভিত্তিক জমির ডেটা সফলভাবে সিড হয়েছে!',
      lands_count: landRecords.length,
      legal_statuses_count: legalStatuses.length,
      hierarchy: {
        division: 'রাজশাহী',
        district: 'বগুড়া',
        upazila: 'শিবগঞ্জ',
        total_mouzas: SHIBGANJ_MOUZAS.length
      },
      note: 'কোনো ডেমো ব্যবহারকারী তৈরি করা হয়নি। Super Admin পরিবেশ পরিবর্তনশীল (env vars) দ্বারা নিয়ন্ত্রিত।'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Seed failed', error: err.message });
  }
});

// GET /api/all-records - Admin view all records
router.get('/all-records', async (req, res) => {
  try {
    const records = await LandRecord.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
