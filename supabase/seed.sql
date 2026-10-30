-- PulseGrid V2 - Seed Data for 40 Bengaluru PHCs across 4 Zones

-- 1. Insert 4 Zones
INSERT INTO zones (id, name, description) VALUES
('zone-1', 'Zone 1 - North Bengaluru', 'Covers northern BBMP sectors including Hebbal, Yelahanka, Vidyaranyapura, RT Nagar'),
('zone-2', 'Zone 2 - South Bengaluru', 'Covers southern BBMP sectors including Jayanagar, JP Nagar, BTM, Banashankari, HSR'),
('zone-3', 'Zone 3 - East Bengaluru', 'Covers eastern BBMP tech corridors including Indiranagar, Whitefield, KR Puram, Marathahalli'),
('zone-4', 'Zone 4 - West Bengaluru', 'Covers western BBMP industrial & residential sectors including Malleshwaram, Rajajinagar, Peenya')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert 40 PHCs (10 per zone) across Bengaluru, Karnataka, India
INSERT INTO phcs (id, name, zone_id, city, state, country, address, latitude, longitude, status, contact_phone) VALUES
-- Zone 1: North Bengaluru (10 PHCs)
('phc-01', 'Hebbal Urban Primary Health Centre', 'zone-1', 'Bengaluru', 'Karnataka', 'India', 'Near Hebbal Flyover, Bellary Road, Hebbal, Bengaluru 560024', 13.0358, 77.5970, 'active', '+91 80 2351 0101'),
('phc-02', 'Yelahanka Old Town PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', 'BBMP Hospital Road, Yelahanka Old Town, Bengaluru 560064', 13.1007, 77.5963, 'active', '+91 80 2846 0202'),
('phc-03', 'Vidyaranyapura Model PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', '5th Main Road, Vidyaranyapura Post, Bengaluru 560097', 13.0783, 77.5582, 'active', '+91 80 2364 0303'),
('phc-04', 'RT Nagar Community PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', '80 Feet Road, 1st Block, RT Nagar, Bengaluru 560032', 13.0247, 77.5948, 'active', '+91 80 2333 0404'),
('phc-05', 'Sahakar Nagar Urban PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', 'F Block, Sahakar Nagar, Bengaluru 560092', 13.0622, 77.5901, 'active', '+91 80 2362 0505'),
('phc-06', 'Mathikere Urban PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', '1st Main Road, Pipeline Road, Mathikere, Bengaluru 560054', 13.0334, 77.5564, 'active', '+91 80 2347 0606'),
('phc-07', 'Sanjaynagar Health Centre', 'zone-1', 'Bengaluru', 'Karnataka', 'India', 'AECS Layout, Sanjaynagar Main Rd, Bengaluru 560094', 13.0381, 77.5752, 'active', '+91 80 2341 0707'),
('phc-08', 'Jakkur Government PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', 'Near Jakkur Aerodrome, Jakkur, Bengaluru 560064', 13.0789, 77.6067, 'active', '+91 80 2856 0808'),
('phc-09', 'Thanisandra Urban PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', 'Thanisandra Main Road, Nagawara Ward, Bengaluru 560077', 13.0543, 77.6322, 'active', '+91 80 2544 0909'),
('phc-10', 'Kodigehalli PHC', 'zone-1', 'Bengaluru', 'Karnataka', 'India', 'Railway Station Road, Kodigehalli, Bengaluru 560092', 13.0610, 77.5720, 'active', '+91 80 2372 1010'),

-- Zone 2: South Bengaluru (10 PHCs)
('phc-11', 'Jayanagar 4th Block Urban PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', '11th Main Road, 4th Block Jayanagar, Bengaluru 560011', 12.9299, 77.5833, 'active', '+91 80 2663 1111'),
('phc-12', 'JP Nagar 2nd Phase Health Centre', 'zone-2', 'Bengaluru', 'Karnataka', 'India', '15th Cross Road, JP Nagar 2nd Phase, Bengaluru 560078', 12.9105, 77.5857, 'active', '+91 80 2659 1212'),
('phc-13', 'BTM Layout Community PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', 'Outer Ring Road, BTM 2nd Stage, Bengaluru 560076', 12.9166, 77.6101, 'active', '+91 80 2668 1313'),
('phc-14', 'Banashankari 2nd Stage PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', '24th Cross Road, Banashankari 2nd Stage, Bengaluru 560070', 12.9254, 77.5647, 'active', '+91 80 2671 1414'),
('phc-15', 'Basavanagudi Urban PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru 560004', 12.9421, 77.5755, 'active', '+91 80 2660 1515'),
('phc-16', 'Padmanabhanagar Urban PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', 'Yarab Nagar Road, Padmanabhanagar, Bengaluru 560070', 12.9179, 77.5574, 'active', '+91 80 2639 1616'),
('phc-17', 'HSR Layout Sector 2 PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', '17th Cross Road, Sector 2, HSR Layout, Bengaluru 560102', 12.9116, 77.6389, 'active', '+91 80 2572 1717'),
('phc-18', 'Koramangala 6th Block PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', '80 Feet Road, 6th Block Koramangala, Bengaluru 560095', 12.9344, 77.6192, 'active', '+91 80 2553 1818'),
('phc-19', 'Electronic City Phase 1 PHC', 'zone-2', 'Bengaluru', 'Karnataka', 'India', 'Hosur Road, Electronic City Phase 1, Bengaluru 560100', 12.8452, 77.6602, 'active', '+91 80 2852 1919'),
('phc-20', 'Bommanahalli Health Centre', 'zone-2', 'Bengaluru', 'Karnataka', 'India', 'Begur Main Road, Bommanahalli, Bengaluru 560068', 12.9023, 77.6241, 'active', '+91 80 2573 2020'),

-- Zone 3: East Bengaluru (10 PHCs)
('phc-21', 'Indiranagar 100ft Road PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038', 12.9719, 77.6412, 'active', '+91 80 2521 2121'),
('phc-22', 'Whitefield Community Health Centre', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'Whitefield Main Road, Inner Circle, Bengaluru 560066', 12.9698, 77.7499, 'active', '+91 80 2845 2222'),
('phc-23', 'KR Puram General PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'Old Madras Road, KR Puram Market, Bengaluru 560036', 13.0075, 77.6959, 'active', '+91 80 2561 2323'),
('phc-24', 'Marathahalli Bridge Urban PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'Varthur Road, Marathahalli Junction, Bengaluru 560037', 12.9591, 77.6974, 'active', '+91 80 2847 2424'),
('phc-25', 'Domlur Village Urban PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'Airport Road, Domlur Village, Bengaluru 560071', 12.9609, 77.6387, 'active', '+91 80 2535 2525'),
('phc-26', 'CV Raman Nagar Urban PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'DRDO Phase 1, CV Raman Nagar, Bengaluru 560093', 12.9854, 77.6639, 'active', '+91 80 2534 2626'),
('phc-27', 'Mahadevapura Model PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'ITPL Main Road, Mahadevapura, Bengaluru 560048', 12.9922, 77.6890, 'active', '+91 80 2851 2727'),
('phc-28', 'Varthur Government PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'Gunjur-Varthur Main Road, Varthur, Bengaluru 560087', 12.9392, 77.7410, 'active', '+91 80 2853 2828'),
('phc-29', 'Ramamurthy Nagar PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'TC Palya Main Road, Ramamurthy Nagar, Bengaluru 560016', 13.0163, 77.6784, 'active', '+91 80 2565 2929'),
('phc-30', 'HAL Old Airport Road PHC', 'zone-3', 'Bengaluru', 'Karnataka', 'India', 'HAL 3rd Stage, Old Airport Road, Bengaluru 560017', 12.9550, 77.6530, 'active', '+91 80 2522 3030'),

-- Zone 4: West Bengaluru (10 PHCs)
('phc-31', 'Malleshwaram 8th Cross PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', 'Margosa Road, 8th Cross Malleshwaram, Bengaluru 560003', 12.9982, 77.5703, 'active', '+91 80 2334 3131'),
('phc-32', 'Rajajinagar 1st Block Urban PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', 'Dr. Rajkumar Road, 1st Block Rajajinagar, Bengaluru 560010', 12.9902, 77.5528, 'active', '+91 80 2332 3232'),
('phc-33', 'Vijayanagar Club Road PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', 'Chord Road, Vijayanagar, Bengaluru 560040', 12.9716, 77.5306, 'active', '+91 80 2339 3333'),
('phc-34', 'Basaveshwaranagar PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', '3rd Stage, 4th Block, Basaveshwaranagar, Bengaluru 560079', 12.9877, 77.5372, 'active', '+91 80 2322 3434'),
('phc-35', 'Yeshwanthpur Market PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', 'Subedar Chatram Road, Yeshwanthpur, Bengaluru 560022', 13.0232, 77.5501, 'active', '+91 80 2337 3535'),
('phc-36', 'Mahalakshmi Layout Urban PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', 'Post Office Road, Mahalakshmi Layout, Bengaluru 560086', 13.0114, 77.5448, 'active', '+91 80 2349 3636'),
('phc-37', 'Kengeri Satellite Town PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', 'Mysore Road, Kengeri Satellite Town, Bengaluru 560060', 12.9177, 77.4839, 'active', '+91 80 2848 3737'),
('phc-38', 'Peenya Industrial Area PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', '1st Stage, Peenya Industrial Area, Bengaluru 560058', 13.0285, 77.5255, 'active', '+91 80 2839 3838'),
('phc-39', 'Nagarabhavi 2nd Stage PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', '80 Feet Ring Road, Nagarabhavi 2nd Stage, Bengaluru 560072', 12.9568, 77.5098, 'active', '+91 80 2321 3939'),
('phc-40', 'Chandra Layout Community PHC', 'zone-4', 'Bengaluru', 'Karnataka', 'India', '8th Main Road, Chandra Layout, Bengaluru 560040', 12.9582, 77.5273, 'active', '+91 80 2328 4040')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Essential Medicines
INSERT INTO medicines (id, name, category, unit, critical_threshold) VALUES
('med-01', 'Cefixime 200mg', 'Antibiotic (Cephalosporin)', 'tablets', 50),
('med-02', 'Amoxicillin 500mg', 'Antibiotic (Penicillin)', 'capsules', 60),
('med-03', 'Paracetamol 500mg', 'Analgesic / Antipyretic', 'tablets', 150),
('med-04', 'Azithromycin 500mg', 'Antibiotic (Macrolide)', 'tablets', 40),
('med-05', 'Metformin 500mg', 'Antidiabetic', 'tablets', 100),
('med-06', 'Amlodipine 5mg', 'Antihypertensive', 'tablets', 80),
('med-07', 'ORS Sachets 21.8g', 'Electrolyte Rehydration', 'sachets', 70),
('med-08', 'Salbutamol Inhaler 100mcg', 'Respiratory / Bronchodilator', 'inhalers', 20),
('med-09', 'Cetirizine 10mg', 'Antihistamine / Allergy', 'tablets', 90),
('med-10', 'Pantoprazole 40mg', 'Antacid / PPI', 'tablets', 80)
ON CONFLICT (id) DO NOTHING;
