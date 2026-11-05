const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'public', 'career.html');

if (fs.existsSync(file)) {
    let html = fs.readFileSync(file, 'utf8');

    // 1.1 Hidden ID qoshish
    if (!html.includes('id="apply-job-id"')) {
        html = html.replace(/(<form[^>]*id="apply-form"[^>]*>)/i, '$1\n        <input type="hidden" id="apply-job-id" value="">');
    }

    // 1.1 Textarea ni almashtirish
    const newTextarea = `<textarea
    id="apply-cover-letter"
    rows="3"
    maxlength="5000"
    placeholder="Nima uchun bu ishga mosligingizni qisqacha yozing..."
    style="width:100%; padding:12px; background:transparent; border:1px solid rgba(74,127,255,0.4); border-radius:8px; color:#fff; outline:none; resize:vertical;"
></textarea>`;
    html = html.replace(/<textarea[^>]*id="apply-cover-letter"[\s\S]*?<\/textarea>/i, newTextarea);

    // 1.2 Modal va Submit funksiyalarini almashtirish
    const oldFuncsRegex = /function\s+openApplyModal[\s\S]*?async\s+function\s+submitJobApplication[\s\S]*?catch\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\n\}/i;
    const newFuncs = `function openApplyModal(jobId) {
    const id = String(
        jobId || new URLSearchParams(window.location.search).get('id') || ''
    );

    if (!/^[a-f0-9]{24}$/i.test(id)) {
        alert("Avval haqiqiy vakansiyani tanlang.");
        return;
    }

    document.getElementById('apply-job-id').value = id;

    if (typeof closeJobModal === 'function') closeJobModal();

    document.getElementById('apply-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeApplyModal() {
    document.getElementById('apply-modal').classList.remove('active');
    document.body.style.overflow = 'auto';

    document.getElementById('apply-success-msg').style.display = 'none';

    const btn = document.getElementById('final-apply-btn');
    if(btn) {
        btn.style.display = 'flex';
        btn.disabled = false;
        btn.innerText = 'Arizani yuborish';
    }
}

async function submitJobApplication(e) {
    e.preventDefault();

    const btn = document.getElementById('final-apply-btn');
    const msg = document.getElementById('apply-success-msg');

    const jobId = document.getElementById('apply-job-id').value;
    const coverLetter = document.getElementById('apply-cover-letter').value.trim();

    if (!/^[a-f0-9]{24}$/i.test(jobId)) {
        alert("Vakansiya ID noto'g'ri. Sahifani yangilang.");
        return;
    }

    if (coverLetter.length > 5000) {
        alert("Xabar 5000 belgidan oshmasligi kerak.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Yuborilmoqda...";

    try {
        const csrfRes = await fetch('/api/csrf-token', {
            credentials: 'same-origin',
            cache: 'no-store'
        });

        const csrfData = await csrfRes.json();

        if (!csrfRes.ok || !csrfData.csrfToken) {
            throw new Error("Xavfsizlik tokenini olish imkonsiz.");
        }

        const response = await fetch(
            \`/api/career/jobs/\${encodeURIComponent(jobId)}/apply\`,
            {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfData.csrfToken
                },
                body: JSON.stringify({ coverLetter })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Ariza yuborilmadi.");
        }

        const applied = new Set(
            JSON.parse(localStorage.getItem('appliedJobs') || '[]')
        );
        applied.add(jobId);
        localStorage.setItem(
            'appliedJobs',
            JSON.stringify([...applied])
        );

        btn.style.display = 'none';
        msg.style.display = 'block';

    } catch (err) {
        console.error("Career ariza xatosi:", err);
        btn.disabled = false;
        btn.innerText = "Qayta urinib ko'ring";
        alert(err.message || "Server bilan bog'lanishda xato yuz berdi.");
    }
}`;
    if(oldFuncsRegex.test(html)) {
        html = html.replace(oldFuncsRegex, newFuncs);
    } else {
        html = html.replace('</body>', `<script>\n${newFuncs}\n</script>\n</body>`);
    }

    // 1.3 Namuna vakansiyalarni tozalash (allJobs = [])
    html = html.replace(/window\.allJobs\s*=\s*\[[\s\S]*?\];/i, 'window.allJobs = [];');

    // 1.3 loadCareerJobs va DOMContentLoaded ni yangilash
    const domContentRegex = /document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[\s\S]*?renderJobs\([\s\S]*?\}\);/i;
    const newLoader = `async function loadCareerJobs() {
    const response = await fetch('/api/career/jobs', {
        credentials: 'same-origin',
        cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success || !Array.isArray(data.jobs)) {
        throw new Error(data.message || "Vakansiyalarni yuklashda xato.");
    }

    window.allJobs = data.jobs.map(job => {
        const employer =
            job.employerId && typeof job.employerId === 'object'
                ? job.employerId
                : {};

        const format = String(job.workFormat || job.format || 'Ofis');

        const skills = Array.isArray(job.requiredSkills)
            ? job.requiredSkills.join(', ')
            : String(job.requiredSkills || job.category || 'Cybersecurity');

        return {
            id: String(job._id),
            title: job.title || 'Nomsiz vakansiya',
            company: employer.name || employer.companyName || 'Ish beruvchi',
            location: job.location || employer.location || 'Ko‘rsatilmagan',
            type: job.jobType || job.employmentType || 'Full-time',
            format,
            salary: job.salary || 'Kelishiladi',
            remote: /remote|masofaviy/i.test(format),
            level: job.level || job.experienceLevel || 'Junior',
            cat: skills
        };
    });

    const badge = document.getElementById('job-count-badge');
    if (badge) badge.innerText = \`\${window.allJobs.length} ta\`;

    window.renderJobs(window.allJobs);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCareerJobs().catch(err => {
        console.error('Vakansiyalarni yuklash xatosi:', err);
        window.allJobs = [];
        if(typeof window.renderJobs === 'function') window.renderJobs([]);
    });
});`;
    if(domContentRegex.test(html)) {
        html = html.replace(domContentRegex, newLoader);
    } else {
        html = html.replace('</body>', `<script>\n${newLoader}\n</script>\n</body>`);
    }

    // 1.3 Tugmani almashtirish
    const oldBtnRegex = /<a\s+href="\/job\?id=\$\{job\.id\}"\s+class="btn\s+btn-secondary"[^>]*>[\s\S]*?<\/a>/i;
    const newBtn = `<button
    type="button"
    onclick="openApplyModal('\${job.id}')"
    class="btn btn-secondary"
    style="width:100%; justify-content:center;"
>
    Ariza yuborish
</button>`;
    html = html.replace(oldBtnRegex, newBtn);

    fs.writeFileSync(file, html, 'utf8');
    console.log("✅ public/career.html muvaffaqiyatli Professorning talabi asosida yangilandi!");
} else {
    console.log("❌ public/career.html topilmadi!");
}
