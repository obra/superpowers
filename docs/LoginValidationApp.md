import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class LoginValidationApp extends JFrame {

    private JTextField usernameField;
    private JPasswordField passwordField;
    private JButton loginButton;

    public LoginValidationApp() {

        setTitle("Login System");
        setSize(350, 220);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        // Create Panel
        JPanel panel = new JPanel();
        panel.setLayout(new GridLayout(4, 2, 10, 10));
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        // Components
        JLabel usernameLabel = new JLabel("Username:");
        usernameField = new JTextField();

        JLabel passwordLabel = new JLabel("Password:");
        passwordField = new JPasswordField();

        loginButton = new JButton("Login");

        // Add components
        panel.add(usernameLabel);
        panel.add(usernameField);
        panel.add(passwordLabel);
        panel.add(passwordField);
        panel.add(new JLabel());
        panel.add(loginButton);

        add(panel);

        // Add button listener
        loginButton.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                validateLogin();
            }
        });
    }

    private void validateLogin() {

        String username = usernameField.getText().trim();
        String password = new String(passwordField.getPassword());

        // 1. Empty field validation
        if (username.isEmpty() || password.isEmpty()) {
            JOptionPane.showMessageDialog(this,
                    "All fields are required!",
                    "Error",
                    JOptionPane.ERROR_MESSAGE);
            return;
        }

        // 2. Username length validation
        if (username.length() < 4) {
            JOptionPane.showMessageDialog(this,
                    "Username must be at least 4 characters.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        // 3. Password length validation
        if (password.length() < 6) {
            JOptionPane.showMessageDialog(this,
                    "Password must be at least 6 characters.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        // 4. Dummy authentication (for demonstration)
        if (username.equals("admin") && password.equals("123456")) {
            JOptionPane.showMessageDialog(this,
                    "Login Successful!",
                    "Success",
                    JOptionPane.INFORMATION_MESSAGE);
        } else {
            JOptionPane.showMessageDialog(this,
                    "Invalid Username or Password",
                    "Login Failed",
                    JOptionPane.ERROR_MESSAGE);
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                new LoginValidationApp().setVisible(true);
            }
        });
    }
}