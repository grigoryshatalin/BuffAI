import puppeteer from 'puppeteer';

export async function fetchProfessorData(name) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36");

  const searchQuery = name.replace(/\s+/g, '+');
  const url = `https://www.ratemyprofessors.com/search/professors/1087?q=${searchQuery}`;

  console.error("Navigating to:", url);

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForSelector('a.TeacherCard__StyledTeacherCard-syjs0d-0', { timeout: 15000 });

    const result = await page.evaluate(() => {
      const prof = document.querySelector('a.TeacherCard__StyledTeacherCard-syjs0d-0');
      if (!prof) return null;

      const name = prof.querySelector('.CardName__StyledCardName-sc-1gyrgim-0')?.innerText.trim() || '';
      const department = prof.querySelector('.CardSchool__Department-sc-19lmz2k-0')?.innerText.trim() || '';
      const school = prof.querySelector('.CardSchool__School-sc-19lmz2k-1')?.innerText.trim() || '';
      const rating = prof.querySelector('.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2')?.innerText.trim() || '';
      const numRatings = prof.querySelector('.CardNumRating__CardNumRatingCount-sc-17t4b9u-3')?.innerText.trim() || '';

      return {
        name,
        department,
        school,
        rating,
        numRatings
      };
    });

    await browser.close();
    return result;
  } catch (err) {
    console.error("Puppeteer error:", err.message);
    await browser.close();
    return null;
  }
}

if (process.argv[2]) {
  const searchName = process.argv.slice(2).join(" ");
  fetchProfessorData(searchName).then((data) => {
    console.log(JSON.stringify(data || { error: "Professor not found" }));
  });
}