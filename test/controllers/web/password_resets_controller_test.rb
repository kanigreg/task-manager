require 'test_helper'

class Web::PasswordResetsControllerTest < ActionController::TestCase
  test 'should get new' do
    get :new
    assert_response :success
  end

  test 'should post create' do
    user = create(:user)
    attr = { email: user.email }

    assert_emails 1 do
      post :create, params: { user_email_form: attr }
    end

    assert_response :redirect
  end

  test 'should get show' do
    token = JsonWebToken.encode
    get :edit, params: { token: token }
    assert_response :success
  end

  test 'should put update' do
    token = JsonWebToken.encode
    user = create(:user, { password: generate(:string), password_reset_token: token })
    previous_password_digest = user.password_digest.dup
    new_password = generate(:string)
    attr = {
      password: new_password,
      password_confirmation: new_password,
    }

    put :update, params: { token: token, password_reset_form: attr }

    assert_response :redirect
    user.reload
    assert_not_equal previous_password_digest, user.password_digest
  end

  test 'token should be single-use' do
    token = JsonWebToken.encode
    user = create(:user, { password: generate(:string), password_reset_token: token })
    previous_password_digest = user.password_digest.dup
    new_password = generate(:string)
    attr = {
      password: new_password,
      password_confirmation: new_password,
    }

    put :update, params: { token: token, password_reset_form: attr }

    assert_response :redirect
    user.reload
    assert_not_equal previous_password_digest, user.password_digest

    previous_password_digest = user.password_digest.dup

    put :update, params: { token: token, password_reset_form: attr }

    user.reload
    assert_equal previous_password_digest, user.password_digest
  end

  test 'token expiration' do
    token = JsonWebToken.encode
    travel 24.hours
    user = create(:user, { password: generate(:string), password_reset_token: token })
    previous_password_digest = user.password_digest.dup
    new_password = generate(:string)
    attr = {
      password: new_password,
      password_confirmation: new_password,
    }

    put :update, params: { token: token, password_reset_form: attr }

    assert_response :redirect
    user.reload
    assert_equal previous_password_digest, user.password_digest
  end
end
