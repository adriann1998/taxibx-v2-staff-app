import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import Dashboard from './components/Dashboard/Dashboard';

// Apollo Provider
const apolloClient = new ApolloClient({
  uri: process.env.REACT_APP_TAXIBOX_API_URL,
  cache: new InMemoryCache(),
});

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
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={MuiTheme}>
        <div className="App">
          <Dashboard />
        </div>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;