import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from './Index';

describe('Index Component', () => {
  const renderWithRouter = () => {
    return render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
  };

  test('renders main heading', () => {
    renderWithRouter();
    expect(screen.getByText('AI Kysyntäennuste')).toBeInTheDocument();
    expect(screen.getByText('avustaja')).toBeInTheDocument();
  });

  test('renders Wisestein logo', () => {
    renderWithRouter();
    const logo = screen.getByText('WISESTEIN');
    expect(logo).toBeInTheDocument();
  });

  test('renders login button', () => {
    renderWithRouter();
    const loginButton = screen.getByText('Kirjaudu sisään');
    expect(loginButton).toBeInTheDocument();
  });

  test('renders main features', () => {
    renderWithRouter();
    const features = [
      'Tekoälyavusteinen ennustaminen',
      'Dokumentoi ja opi',
      'Syvähaku signaaleista'
    ];
    
    features.forEach(feature => {
      const featureElement = screen.getByText(feature);
      expect(featureElement).toBeInTheDocument();
    });
  });

  test('renders call-to-action buttons', () => {
    renderWithRouter();
    const ctaButtons = screen.getAllByText('Varaa esittely');
    expect(ctaButtons).toHaveLength(2);
  });

  test('renders footer sections', () => {
    renderWithRouter();
    const sections = ['Palvelut', 'Ratkaisut', 'Yritys', 'Yhteystiedot'];
    
    sections.forEach(section => {
      const sectionHeading = screen.getByText(section);
      expect(sectionHeading).toBeInTheDocument();
    });
  });

  test('renders copyright notice', () => {
    renderWithRouter();
    const currentYear = new Date().getFullYear();
    const copyright = screen.getByText(`© ${currentYear} Wisestein. Kaikki oikeudet pidätetään.`);
    expect(copyright).toBeInTheDocument();
  });
}); 