export const homeController = (req, res) => {
  res.status(200).render('homeViews/home', {
    title: 'Bird Watching',
    page: 'home',
    desc: 'This is the home page where is set up a welcome page with links to other home pages',

  });
};
export const aboutController = (req, res) => {
  res.status(200).render('homeViews/home', {
    title: 'Bird Watching',
    page: 'about',
    desc: 'This is the about page where is set up a welcome page with links to other home pages',

  });
};
export const createNoteController = (req, res) => {
  res.status(200).render('homeViews/createNote');
};
