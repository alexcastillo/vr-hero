import { VrHeroPage } from './app.po';

describe('vr-hero App', () => {
  let page: VrHeroPage;

  beforeEach(() => {
    page = new VrHeroPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
