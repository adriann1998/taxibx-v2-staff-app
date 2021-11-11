import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';

// Theme styling for the whole app.
const MuiTheme = createTheme({
  palette: {
    primary: {
      light: '#ffff56',
      main: '#ffe800',
      dark: '#ffd200',
      contrastText: '#000',
    },
    secondary: {
      light: '#2c2c2c',
      main: '#000000',
      dark: '#000000',
      contrastText: '#fff',
    },
  },
});

/**
 * Root component of the React app wrapped with custom theme defined.
 */
 function App()  {

  return (
    <ThemeProvider theme={MuiTheme}>
      <div className="App">
        <Dashboard />
      </div>
    </ThemeProvider>
  );

}

export default App;