# Jem Design Studio — የመጀመሪያ ስሪት

ይህ የJem Design Studio የመጀመሪያ Web App ነው። በስልክና በኮምፒውተር ላይ ይሰራል።

## የሚሰሩ ባህሪያት
- Exterior, Interior, Floor Plan, Site Plan, Landscape, Commercial እና Other Architecture ምድቦች
- የዲዛይን መግለጫ፣ የስታይልና የውጤት አይነት ምርጫ
- የምሳሌ ፎቶ መጫንና AI የምስል ማመንጨት/ማሻሻል
- PNG ማውረድ
- በዚያው ብራውዘር ውስጥ ፕሮጀክቶችን ማስቀመጥ

## Netlify ላይ ማስነሳት
1. ZIP ፋይሉን አውርድና ውስጡን አውጣ።
2. GitHub ላይ አዲስ repository ፍጠርና የZIP ውስጥ ያሉትን ፋይሎች ጫን። `index.html` በrepository ዋና ደረጃ ላይ መሆን አለበት።
3. Netlify ውስጥ **Add new site → Import an existing project** በመጫን GitHub repository አገናኝ።
4. Build command ባዶ ይተው፤ Publish directory `.` ይሁን።
5. Netlify → Site configuration → Environment variables ውስጥ `OPENAI_API_KEY` በሚለው ስም የራስህን OpenAI API key አስገባ።
6. Deploys → Trigger deploy → Deploy site በማድረግ እንደገና deploy አድርግ።

## አስፈላጊ
- API key በHTML/JavaScript ውስጥ አታስገባ። በNetlify Environment Variables ብቻ አስቀምጥ።
- AI ምስል ማመንጨት የOpenAI API መለያ፣ የAPI ክሬዲት/ክፍያ እና ተገቢ የAPI መዳረሻ ይፈልጋል። ChatGPT subscription ከAPI ክፍያ የተለየ ነው።
- Reference image ከተጫነ `/v1/images/edits` ይጠቀማል፤ ካልተጫነ `/v1/images/generations` ይጠቀማል።
- የAI ውጤት የንድፍ ጽንሰ-ሀሳብ ነው። ለግንባታ ከመጠቀም በፊት በባለሙያ አርክቴክት/ኢንጂነር ይረጋገጥ።
- የተቀመጡ ፕሮጀክቶች በአሁኑ ጊዜ በአንድ browser ውስጥ localStorage ላይ ብቻ ይቀመጣሉ። በተለያዩ መሣሪያዎች ለማመሳሰል በቀጣይ የdatabase/login ክፍል ያስፈልጋል።

## API
ይህ ስሪት OpenAI Images API ን በNetlify Function ይጠቀማል። የአሁኑ የምስል ሞዴሎችና የAPI መመሪያዎች በOpenAI ሰነድ ይመልከቱ፦ https://developers.openai.com/api/docs/guides/image-generation
