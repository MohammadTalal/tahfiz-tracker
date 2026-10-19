import type { Locale } from "@/i18n/routing";

/** A paragraph, or a bullet list when given as an array. */
export type Block = string | string[];
export type LegalSection = { heading: string; blocks: Block[] };
export type LegalDocument = { title: string; intro: string; sections: LegalSection[] };

// Keep both languages in sync: same sections, same facts. Any change to what
// the app collects or where data is stored must be reflected here.

export const privacyPolicy: Record<Locale, LegalDocument> = {
  en: {
    title: "Privacy Policy",
    intro:
      "This policy explains what information the Quran Learning Platform collects, why, who can see it, and the choices you have. The platform is used by mosques, Quran schools and teachers to track students' memorization and revision, and by parents to follow their children's progress.",
    sections: [
      {
        heading: "Who this applies to",
        blocks: [
          "Organization administrators, teachers and parents who create an account, and the students whose learning records teachers enter. Students do not have accounts.",
          "Each organization (for example a mosque) decides which students and parents to add. For student records, the organization is responsible for the information it enters, and we process it on the organization's behalf.",
        ],
      },
      {
        heading: "What we collect",
        blocks: [
          [
            "Account information: your name, email address, preferred language, and a password (stored only in hashed form by our authentication provider; we never see it).",
            "Organization information: name, type, time zone, and optional contact details.",
            "Student information: a display name only (a first name or nickname is enough). We do not ask for birth dates, addresses, photos, school details or government identifiers.",
            "Learning records: passages recited, ratings, mistake categories, feedback for parents, private notes for teachers, assignments and dates.",
            "Relationships: which teachers teach which classes or students, and which parents are linked to which children.",
            "Invitations: a one-way hash of each invitation link, and an email address if the inviter adds one.",
            "Security records: a log of important actions (such as creating an organization or accepting an invitation), and standard technical logs from our hosting providers (IP address, browser type, time of request).",
          ],
          "Cookies: we use only essential cookies to keep you signed in and to remember your language. We do not use advertising or analytics trackers.",
        ],
      },
      {
        heading: "Why we use it",
        blocks: [
          [
            "To provide the service: recording lessons, assignments and progress for the organization.",
            "To let parents follow their own children's progress.",
            "To keep the service secure, prevent misuse and investigate problems.",
            "To send essential emails, such as account confirmation and password reset.",
          ],
          "We do not sell personal information, show advertising, or use students' records to profile them or target anyone.",
        ],
      },
      {
        heading: "Who can see what",
        blocks: [
          [
            "Organization administrators: their organization's classes, students and records.",
            "Teachers: only the students they teach.",
            "Parents: only the children they are linked to, and only what is meant for parents. Teachers' private notes are never shown to parents.",
            "Other organizations: nothing. Each organization's data is separated and protected by access rules in the database.",
            "Us: only when needed to run, secure or support the service.",
          ],
        ],
      },
      {
        heading: "Children's information",
        blocks: [
          "Most students are children. Organizations must only add a child if they have the authority to do so, including any consent required from the child's parent or guardian. We keep student information to the minimum needed to track learning.",
          "Parents and guardians can ask the organization, or us, to see, correct or delete their child's information.",
        ],
      },
      {
        heading: "Where information is stored",
        blocks: [
          [
            "Database and accounts: Supabase, in its Canada (Central) region.",
            "Website hosting: Vercel. Requests to the website may be processed on servers in the United States.",
            "Email: account emails are sent through our email provider.",
          ],
          "These providers process information only to provide their services to us and are bound by their own privacy and security commitments.",
        ],
      },
      {
        heading: "How long we keep it",
        blocks: [
          "We keep information while the organization uses the service. When a lesson record is corrected or deleted, a history of the change is kept so mistakes can be traced and undone.",
          "If an organization stops using the service, or you ask us to delete information, we delete it within 90 days, except where the law requires us to keep it. Copies in backups are removed as those backups expire.",
          "If a parent deletes their account, the link to their child is removed; the child's learning records stay with the organization.",
        ],
      },
      {
        heading: "How we protect it",
        blocks: [
          [
            "Encrypted connections (HTTPS) for all traffic.",
            "Access rules enforced inside the database, so each user can reach only what they are allowed to see.",
            "Passwords and invitation links are stored only as one-way hashes.",
            "A log of important actions for accountability.",
          ],
        ],
      },
      {
        heading: "Your choices and rights",
        blocks: [
          "You can ask to access, correct or delete your personal information, or withdraw your consent, by contacting your organization or us. We will respond within 30 days.",
          "If you are not satisfied with our answer, you can contact the Office of the Privacy Commissioner of Canada (priv.gc.ca).",
        ],
      },
      {
        heading: "Changes to this policy",
        blocks: [
          "We will update this page when our practices change and change the date above. For significant changes, we will notify organization administrators.",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    intro:
      "توضح هذه السياسة المعلومات التي تجمعها منصة تحفيظ القرآن، وسبب جمعها، ومن يمكنه الاطلاع عليها، والخيارات المتاحة لك. تستخدم المساجدُ ومدارسُ تحفيظ القرآن والمعلمون المنصةَ لمتابعة حفظ الطلاب ومراجعتهم، ويستخدمها أولياء الأمور لمتابعة تقدّم أبنائهم.",
    sections: [
      {
        heading: "على من تنطبق هذه السياسة",
        blocks: [
          "على مشرفي الجهات والمعلمين وأولياء الأمور الذين ينشئون حسابًا، وعلى الطلاب الذين يُدخل المعلمون سجلاتهم التعليمية. ليس للطلاب حسابات.",
          "كل جهة (مثل المسجد) تقرر أي الطلاب وأولياء الأمور تضيفهم. والجهة مسؤولة عن معلومات الطلاب التي تُدخلها، ونحن نعالجها نيابةً عنها.",
        ],
      },
      {
        heading: "ما الذي نجمعه",
        blocks: [
          [
            "معلومات الحساب: اسمك، وبريدك الإلكتروني، ولغتك المفضلة، وكلمة مرور تُحفظ بصيغة مُشفّرة باتجاه واحد لدى مزوّد خدمة الدخول، ولا نطّلع عليها.",
            "معلومات الجهة: الاسم، والنوع، والمنطقة الزمنية، وبيانات تواصل اختيارية.",
            "معلومات الطالب: اسم للعرض فقط (يكفي الاسم الأول أو اسم مختصر). لا نطلب تاريخ الميلاد أو العنوان أو الصور أو بيانات المدرسة أو أي رقم هوية.",
            "السجلات التعليمية: المقاطع المُسمَّعة، والتقييم، وأنواع الأخطاء، والملاحظات لولي الأمر، والملاحظات الخاصة بالمعلمين، والمهام، والتواريخ.",
            "العلاقات: أي المعلمين يدرّسون أي الحلقات أو الطلاب، وأي أولياء الأمور مرتبطون بأي الأبناء.",
            "الدعوات: قيمة مُشفّرة باتجاه واحد لكل رابط دعوة، وبريد إلكتروني إن أضافه صاحب الدعوة.",
            "سجلات الأمان: سجل بالإجراءات المهمة (مثل إنشاء جهة أو قبول دعوة)، وسجلات تقنية معتادة لدى مزوّدي الاستضافة (عنوان IP، ونوع المتصفح، ووقت الطلب).",
          ],
          "ملفات تعريف الارتباط: نستخدم فقط الملفات الضرورية لإبقائك مسجّلًا للدخول وتذكّر لغتك. لا نستخدم أدوات إعلانية أو أدوات تتبع وتحليل.",
        ],
      },
      {
        heading: "لماذا نستخدمها",
        blocks: [
          [
            "لتقديم الخدمة: تسجيل الدروس والمهام والتقدّم للجهة.",
            "لتمكين أولياء الأمور من متابعة تقدّم أبنائهم فقط.",
            "للحفاظ على أمان الخدمة ومنع إساءة استخدامها ومعالجة المشكلات.",
            "لإرسال الرسائل الضرورية مثل تأكيد الحساب واستعادة كلمة المرور.",
          ],
          "لا نبيع المعلومات الشخصية، ولا نعرض إعلانات، ولا نستخدم سجلات الطلاب لتصنيفهم أو لاستهداف أي شخص.",
        ],
      },
      {
        heading: "من يمكنه الاطلاع على ماذا",
        blocks: [
          [
            "مشرفو الجهة: حلقات الجهة وطلابها وسجلاتها.",
            "المعلمون: الطلاب الذين يدرّسونهم فقط.",
            "أولياء الأمور: أبناؤهم المرتبطون بهم فقط، وما هو مخصص لأولياء الأمور فقط. لا تظهر الملاحظات الخاصة بالمعلمين لأولياء الأمور أبدًا.",
            "الجهات الأخرى: لا شيء. بيانات كل جهة منفصلة ومحمية بقواعد صلاحيات داخل قاعدة البيانات.",
            "نحن: فقط عند الحاجة لتشغيل الخدمة أو حمايتها أو تقديم الدعم.",
          ],
        ],
      },
      {
        heading: "معلومات الأطفال",
        blocks: [
          "معظم الطلاب أطفال. على الجهة ألّا تضيف طفلًا إلا إذا كانت مخوّلة بذلك، بما في ذلك أي موافقة مطلوبة من ولي أمره. ونقتصر في معلومات الطلاب على الحد الأدنى اللازم لمتابعة التعلّم.",
          "يمكن لأولياء الأمور أن يطلبوا من الجهة أو منا الاطلاع على معلومات أبنائهم أو تصحيحها أو حذفها.",
        ],
      },
      {
        heading: "أين تُحفظ المعلومات",
        blocks: [
          [
            "قاعدة البيانات والحسابات: لدى Supabase في منطقة كندا (الوسطى).",
            "استضافة الموقع: لدى Vercel، وقد تُعالَج طلبات الموقع على خوادم في الولايات المتحدة.",
            "البريد الإلكتروني: تُرسَل رسائل الحساب عبر مزوّد خدمة البريد لدينا.",
          ],
          "يعالج هؤلاء المزوّدون المعلومات فقط لتقديم خدماتهم لنا، ويلتزمون بتعهداتهم الخاصة بالخصوصية والأمان.",
        ],
      },
      {
        heading: "مدة الاحتفاظ بالمعلومات",
        blocks: [
          "نحتفظ بالمعلومات ما دامت الجهة تستخدم الخدمة. وعند تصحيح سجل درس أو حذفه، يُحفظ تاريخ التغيير ليمكن تتبّع الأخطاء والتراجع عنها.",
          "إذا توقفت الجهة عن استخدام الخدمة، أو طلبتَ حذف معلوماتك، نحذفها خلال ٩٠ يومًا، إلا ما يلزمنا القانون بالاحتفاظ به. وتُزال النسخ الموجودة في النسخ الاحتياطية عند انتهاء صلاحيتها.",
          "إذا حذف ولي الأمر حسابه، يُزال ارتباطه بابنه، وتبقى السجلات التعليمية للابن لدى الجهة.",
        ],
      },
      {
        heading: "كيف نحمي المعلومات",
        blocks: [
          [
            "اتصالات مُشفّرة (HTTPS) لجميع البيانات المتبادلة.",
            "قواعد صلاحيات مُطبّقة داخل قاعدة البيانات، فلا يصل كل مستخدم إلا إلى ما يحق له.",
            "تُحفظ كلمات المرور وروابط الدعوة بصيغة مُشفّرة باتجاه واحد فقط.",
            "سجل بالإجراءات المهمة لضمان المساءلة.",
          ],
        ],
      },
      {
        heading: "خياراتك وحقوقك",
        blocks: [
          "يمكنك طلب الاطلاع على معلوماتك الشخصية أو تصحيحها أو حذفها، أو سحب موافقتك، بالتواصل مع جهتك أو معنا. وسنرد خلال ٣٠ يومًا.",
          "إن لم يُرضِك ردّنا، يمكنك التواصل مع مكتب مفوّض الخصوصية في كندا (priv.gc.ca).",
        ],
      },
      {
        heading: "التغييرات على هذه السياسة",
        blocks: [
          "سنحدّث هذه الصفحة عند تغيّر ممارساتنا ونغيّر التاريخ أعلاه. وعند التغييرات الجوهرية سنُبلغ مشرفي الجهات.",
        ],
      },
    ],
  },
};

export const termsOfService: Record<Locale, LegalDocument> = {
  en: {
    title: "Terms of Service",
    intro:
      "These terms apply when you use the Quran Learning Platform. By creating an account or using the service, you agree to them.",
    sections: [
      {
        heading: "The service",
        blocks: [
          "The platform helps organizations and teachers record Quran memorization and revision, and lets parents follow their children's progress. It is currently offered free of charge as a pilot and may change as we improve it.",
        ],
      },
      {
        heading: "Accounts",
        blocks: [
          [
            "Accounts are for adults: administrators, teachers and parents or guardians.",
            "Give accurate information and keep your password private. You are responsible for activity under your account.",
            "Tell us promptly if you believe your account has been used without permission.",
          ],
        ],
      },
      {
        heading: "Organizations' responsibilities",
        blocks: [
          [
            "Only add students and parents you are authorized to add, including any consent required from a child's parent or guardian.",
            "Keep student information to what is needed for learning, and do not enter sensitive details that the service does not ask for.",
            "Only invite people who should have access, and remove access when it is no longer needed.",
          ],
        ],
      },
      {
        heading: "Acceptable use",
        blocks: [
          [
            "Do not use the service for anything unlawful, harmful or abusive.",
            "Do not try to access information you are not permitted to see, test or bypass security, or disrupt the service.",
            "Do not share invitation links publicly; each link is meant for one person.",
          ],
        ],
      },
      {
        heading: "Your content",
        blocks: [
          "Organizations own the records they enter. You allow us to store and process that content only to provide the service, as described in the Privacy Policy.",
        ],
      },
      {
        heading: "Assessments",
        blocks: [
          "Ratings, feedback and suggestions in the platform are the teacher's own assessments and planning aids. They are not certifications of Quran memorization.",
        ],
      },
      {
        heading: "Availability and changes",
        blocks: [
          "We work to keep the service reliable but cannot promise it will always be available or free of errors. We may change or stop features; for significant changes we will give organizations reasonable notice and a way to export their records.",
        ],
      },
      {
        heading: "Ending use",
        blocks: [
          "You can stop using the service at any time. We may suspend accounts that break these terms or put others at risk. Information is then handled as described in the Privacy Policy.",
        ],
      },
      {
        heading: "Liability",
        blocks: [
          "The service is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential losses arising from its use. Nothing in these terms limits rights you have under consumer protection or privacy law.",
        ],
      },
      {
        heading: "Changes to these terms",
        blocks: [
          "We may update these terms and will change the date above. Continuing to use the service after an update means you accept the new terms.",
        ],
      },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    intro:
      "تنطبق هذه الشروط عند استخدامك منصة تحفيظ القرآن. وبإنشائك حسابًا أو استخدامك الخدمة فإنك توافق عليها.",
    sections: [
      {
        heading: "الخدمة",
        blocks: [
          "تساعد المنصة الجهاتِ والمعلمين على تسجيل حفظ القرآن ومراجعته، وتمكّن أولياء الأمور من متابعة تقدّم أبنائهم. وهي مقدّمة حاليًا مجانًا كمرحلة تجريبية، وقد تتغير مع تطويرها.",
        ],
      },
      {
        heading: "الحسابات",
        blocks: [
          [
            "الحسابات للبالغين: المشرفين والمعلمين وأولياء الأمور.",
            "قدّم معلومات صحيحة واحتفظ بكلمة مرورك سرّية. أنت مسؤول عن النشاط الذي يتم عبر حسابك.",
            "أبلغنا فورًا إن اعتقدت أن حسابك استُخدم دون إذنك.",
          ],
        ],
      },
      {
        heading: "مسؤوليات الجهات",
        blocks: [
          [
            "لا تُضف إلا الطلاب وأولياء الأمور المخوّل بإضافتهم، بما في ذلك أي موافقة مطلوبة من ولي أمر الطفل.",
            "اقتصر في معلومات الطلاب على ما يلزم للتعلّم، ولا تُدخل بيانات حساسة لا تطلبها الخدمة.",
            "لا تدعُ إلا من يحق له الوصول، وأزل الصلاحية عند انتهاء الحاجة إليها.",
          ],
        ],
      },
      {
        heading: "الاستخدام المقبول",
        blocks: [
          [
            "لا تستخدم الخدمة في أي أمر مخالف للقانون أو ضار أو مسيء.",
            "لا تحاول الوصول إلى معلومات لا يحق لك رؤيتها، أو اختبار وسائل الحماية أو تجاوزها، أو تعطيل الخدمة.",
            "لا تنشر روابط الدعوة علنًا؛ فكل رابط مخصص لشخص واحد.",
          ],
        ],
      },
      {
        heading: "المحتوى الخاص بك",
        blocks: [
          "تملك الجهات السجلات التي تُدخلها. وتأذن لنا بحفظ هذا المحتوى ومعالجته لتقديم الخدمة فقط، كما هو موضح في سياسة الخصوصية.",
        ],
      },
      {
        heading: "التقييمات",
        blocks: [
          "التقييمات والملاحظات والاقتراحات في المنصة هي تقديرات المعلم الخاصة ووسائل مساعدة للتخطيط، وليست شهادات بإتمام الحفظ.",
        ],
      },
      {
        heading: "توفّر الخدمة والتغييرات",
        blocks: [
          "نسعى لأن تكون الخدمة موثوقة، لكن لا نضمن توفّرها دائمًا أو خلوّها من الأخطاء. وقد نغيّر الميزات أو نوقفها؛ وعند التغييرات الجوهرية سنمنح الجهات مهلة معقولة وطريقة لتصدير سجلاتها.",
        ],
      },
      {
        heading: "إنهاء الاستخدام",
        blocks: [
          "يمكنك التوقف عن استخدام الخدمة في أي وقت. وقد نعلّق الحسابات التي تخالف هذه الشروط أو تعرّض الآخرين للخطر. وتُعامَل المعلومات بعد ذلك كما هو موضح في سياسة الخصوصية.",
        ],
      },
      {
        heading: "المسؤولية",
        blocks: [
          "تُقدَّم الخدمة «كما هي». وبالقدر الذي يسمح به القانون، لا نتحمل مسؤولية الخسائر غير المباشرة أو التبعية الناتجة عن استخدامها. ولا يحدّ شيء في هذه الشروط من حقوقك بموجب قوانين حماية المستهلك أو الخصوصية.",
        ],
      },
      {
        heading: "التغييرات على هذه الشروط",
        blocks: [
          "قد نحدّث هذه الشروط ونغيّر التاريخ أعلاه. واستمرارك في استخدام الخدمة بعد التحديث يعني قبولك الشروط الجديدة.",
        ],
      },
    ],
  },
};

export const aboutPage: Record<Locale, LegalDocument> = {
  en: {
    title: "About",
    intro:
      "The Quran Learning Platform helps Quran teachers record each student's memorization and revision in seconds, and lets parents follow their children's progress. It is free to use while we pilot it with mosques and teachers.",
    sections: [
      {
        heading: "Principles",
        blocks: [
          [
            "Quran memorization and revision come first.",
            "Recording a lesson should take seconds, on a phone, during class.",
            "Each organization's data is private and separated.",
            "Parents see only their own children, and only what is meant for them.",
            "No advertising inside the app, and no selling of data.",
          ],
        ],
      },
      {
        heading: "Quran data",
        blocks: [
          "Surah names, ayah counts and page, juz and hizb divisions come from the Tanzil Quran Metadata (tanzil.net), © 2008–2009 Tanzil.info, used under the Creative Commons Attribution 3.0 licence. Riwayah: Hafs ʿan ʿĀsim; pages follow the 604-page Madani Mushaf.",
        ],
      },
    ],
  },
  ar: {
    title: "عن المنصة",
    intro:
      "تساعد منصة تحفيظ القرآن معلمي القرآن على تسجيل حفظ كل طالب ومراجعته في ثوانٍ، وتمكّن أولياء الأمور من متابعة تقدّم أبنائهم. وهي مجانية خلال المرحلة التجريبية مع المساجد والمعلمين.",
    sections: [
      {
        heading: "مبادئنا",
        blocks: [
          [
            "الحفظ والمراجعة أولًا.",
            "تسجيل الدرس يستغرق ثوانيَ، من الهاتف، أثناء الحلقة.",
            "بيانات كل جهة خاصة ومنفصلة.",
            "يرى ولي الأمر أبناءه فقط، وما هو مخصص له فقط.",
            "لا إعلانات داخل التطبيق، ولا بيع للبيانات.",
          ],
        ],
      },
      {
        heading: "بيانات المصحف",
        blocks: [
          "أسماء السور وعدد الآيات وتقسيم الصفحات والأجزاء والأحزاب مأخوذة من بيانات مشروع تنزيل (tanzil.net)، © 2008–2009 Tanzil.info، بموجب ترخيص المشاع الإبداعي - نسب المصنَّف 3.0. الرواية: حفص عن عاصم، والصفحات وفق مصحف المدينة ذي الـ٦٠٤ صفحات.",
        ],
      },
    ],
  },
};
