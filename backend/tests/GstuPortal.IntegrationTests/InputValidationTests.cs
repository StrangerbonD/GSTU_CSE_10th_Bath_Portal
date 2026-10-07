using GstuPortal.Application.Common.Validation;
using Xunit;

namespace GstuPortal.IntegrationTests;

public class InputValidationTests
{
    [Theory]
    [InlineData("short")]
    [InlineData("1234567")]
    [InlineData("nodigitsallowed")]
    [InlineData("12345678")] // only digits
    [InlineData(null)]
    [InlineData("")]
    [InlineData("StrongPassword2026")] // missing special character
    public void ValidatePassword_Rejects_Invalid_Passwords(string? password)
    {
        Assert.Throws<ArgumentException>(() => InputRules.ValidatePassword(password));
    }

    [Theory]
    [InlineData("ValidPass123!")]
    [InlineData("P@ssw0rd")]
    [InlineData("Strong@2026")]
    public void ValidatePassword_Accepts_Valid_Passwords(string password)
    {
        var exception = Record.Exception(() => InputRules.ValidatePassword(password));
        Assert.Null(exception);
    }

    [Theory]
    [InlineData("ab")] // too short
    [InlineData("user name with space")]
    [InlineData("invalid$char")]
    [InlineData(null)]
    [InlineData("")]
    public void ValidateUsername_Rejects_Invalid_Usernames(string? username)
    {
        Assert.Throws<ArgumentException>(() => InputRules.ValidateUsername(username));
    }

    [Theory]
    [InlineData("bondhon")]
    [InlineData("user_123")]
    [InlineData("student-cse.10")]
    public void ValidateUsername_Accepts_Valid_Usernames(string username)
    {
        var exception = Record.Exception(() => InputRules.ValidateUsername(username));
        Assert.Null(exception);
    }

    [Theory]
    [InlineData("plainaddress")]
    [InlineData("@missingusername.com")]
    [InlineData("username@.com")]
    [InlineData(null)]
    [InlineData("")]
    public void ValidateEmail_Rejects_Invalid_Emails(string? email)
    {
        Assert.Throws<ArgumentException>(() => InputRules.ValidateEmail(email));
    }

    [Theory]
    [InlineData("student@gstu.ac.bd")]
    [InlineData("bondhon.saha@gmail.com")]
    public void ValidateEmail_Accepts_Valid_Emails(string email)
    {
        var exception = Record.Exception(() => InputRules.ValidateEmail(email));
        Assert.Null(exception);
    }

    [Theory]
    [InlineData("INVALID_FORMAT")]
    [InlineData("20CSE")]
    [InlineData("CSE016")]
    public void ValidateOptionalStudentId_Rejects_Malformed_Rolls(string studentId)
    {
        Assert.Throws<ArgumentException>(() => InputRules.ValidateOptionalStudentId(studentId));
    }

    [Theory]
    [InlineData("20CSE016")]
    [InlineData("19CSE024")]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateOptionalStudentId_Accepts_Valid_Rolls_Or_Null(string? studentId)
    {
        var exception = Record.Exception(() => InputRules.ValidateOptionalStudentId(studentId));
        Assert.Null(exception);
    }
}
